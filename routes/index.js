const express = require('express');
const router = express.Router();

const axios = require("axios");

const {getAxiosRequest, getCommentsEndpoint, populatePostMap, declareInitials,
    getPostsByUserIdUrl, addCommentsToPosts } = require("../utils/helpers");
const {config} = require("../config");
const {validateUserId} = require("../middlewares/middlewares");


/* GET - no userId given */
router.get('/', function(req, res, next) {
   next();
});

/* GET - userId given or no userId explicitly given */
// Question mark means empty userId value is permitted
router.get('/:userId?', validateUserId, (req, res, next) => {
    endpoint(res, req);
});

const postsNotFound = (posts) => !posts || posts.length === 0;
const handle404 = (res, message) => res.status(404).json(message);
const getCommentsAxiosRequest = (postId) => getAxiosRequest(getCommentsEndpoint(postId));

// const parallelCommentsRequest = (res, req, comments)

const handlePostsResponse = (res, req, posts) => {
    const userId = req.params.userId;

    if (postsNotFound(posts)) {
        handle404(res, `Posts not found for user ${userId}`);
        return
    }

    let { postMap, resJson } = declareInitials();
    populatePostMap(posts, postMap);

    // Array of requests to be handled parallelly
    const commentsByPostIdRequests = posts.map((post) => getCommentsAxiosRequest(post.id));
    // Promise.all using axios
    axios.all(commentsByPostIdRequests)
        .then(axios.spread((...commentsResponses) => {
            if (commentsResponses.length !== postMap.size) {
                console.log(`Not every post of user ${userId} has been commented`);
            }
            addCommentsToPosts(commentsResponses.map((response) => response.data), postMap, resJson);
            res.json(resJson);
        }))
        .catch(commentErrors => {
            console.log("Error while fetching comments: ", commentErrors);
        });
}

const endpoint = (res, req) => {
    // Posts by user id url
    const postsUrl = getPostsByUserIdUrl(req.params.userId);

    axios.get(postsUrl, config)
      .then(posts => handlePostsResponse(res, req, posts.data))
      .catch((postError) => {
          handle404(res, `Not found. Error: ${postError}`);
      });
}

module.exports = router;
