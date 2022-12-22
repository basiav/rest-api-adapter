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
const getCommentsAxiosRequest = (postId) =>  getAxiosRequest(getCommentsEndpoint(postId));

const endpoint = (res, req) => {
    const userId = req.params.userId;
    const postsByUserIdUrl = getPostsByUserIdUrl(userId);

    const posts = axios.get(postsByUserIdUrl, config)
      .then(posts => {
        posts = posts.data;

        if (postsNotFound(posts)) {
            handle404(res, `Posts not found for user ${userId}`);
            return;
        }

        let { postMap, resJson } = declareInitials();
        populatePostMap(posts, postMap);

        const parallelAxiosCommentsRequests = posts.map((post) => getCommentsAxiosRequest(post.id));
        // Promise.all using axios
        const promises = axios.all(parallelAxiosCommentsRequests)
            .then(axios.spread((...commentsResponses) => {
                if (commentsResponses.length !== postMap.size) {
                    console.log(`Not every post of user ${userId} has been commented`);
                }
                commentsResponses = commentsResponses.map((response) => response.data);
                addCommentsToPosts(commentsResponses, postMap, resJson);
                res.json(resJson);
            }))
            .catch(commentErrors => {
              console.log("Error while fetching comments: ", commentErrors);
            });
      })
      .catch((postError) => {
          console.log(`Error while fetching user's ${userId} posts: `, postError);
          handle404(res, "Not found");
      });
}

module.exports = router;
