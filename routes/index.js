const express = require('express');
const router = express.Router();

const axios = require("axios");
let alert = require('alert');

const {getAxiosRequest, getCommentsEndpoint, populatePostMap, declareInitials, readUserId, getPostsByUserIdUrl} = require("../utils/helpers");
const {config} = require("../config");


/* GET - no userId given */
router.get('/', function(req, res, next) {
   next();
});

const validateUserId = async(req, res, next) => {
    if (!req.params.userId) {
        alert("No userId given, please input userId to the console...");
        const userId = await readUserId();
        req.params.userId = userId;
    };
    next();
}

/* GET - userId given or no userId explicitly given */
// Question mark means empty userId value is permitted
router.get('/:userId?', validateUserId, (req, res, next) => {
    endpoint(res, req)
});

const postsNotFound = (posts) => !posts || posts.length === 0;
const handle404 = (res, message) => res.status(404).json(message);
const getCommentsAxiosRequest = (postId) =>  getAxiosRequest(getCommentsEndpoint(postId));

const addCommentsToPosts = (commentsResponses, postMap, resJson) => {
    commentsResponses.forEach((response) => {
        if (response) {
            let postId = response[0].postId;
            let post = postMap.get(postId);
            if (post) {
                post = {...post, "comments": response};
                resJson.push(post);
            }
        }
    });
};

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
            .catch(errors => {
              console.log("Error while fetching comments: ", errors);
            });
      })
      .catch((error) => {
          console.log(`Error while fetching user's ${userId} posts: `, error);
          handle404(res, "Not found");
      });

}

module.exports = router;
