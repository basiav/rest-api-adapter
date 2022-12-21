const express = require('express');
const router = express.Router();

const axios = require("axios");

const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

const URL_BASE = 'https://jsonplaceholder.typicode.com/';
const COMMENTS_LIMIT = 5;
let userId;

/* GET home page. */
router.get('/', function(req, res, next) {
    endpoint(res, req);
});

const getReadlinePromise = (query) => {
  return new Promise((resolve, reject) => {
    rl.question(query, (answer) => {
      resolve(answer);
    })
  });
}

const config = {
    headers: {"Accept-Encoding": "gzip,deflate,compress"}
};

const applyCommentsLimit = (commentsByPostIdUrl) => {
    return `${commentsByPostIdUrl}&_limit=${COMMENTS_LIMIT}`;
};

const getLimitedCommentsUrl = (commentsByPostIdUrl) => {
    return applyCommentsLimit(commentsByPostIdUrl);
};

const getCommentsByPostIdUrl = (postId) => {
    return `${URL_BASE}comments?postId=${postId}`;
};

const getCommentsEndpoint = (postId) => {
    return getLimitedCommentsUrl(getCommentsByPostIdUrl(postId))
}

const getAxiosRequest = (endpoint) => {
    return axios.get(endpoint, config);
};

const populatePostMap = (posts, postMap) => {
    posts.forEach(post => {
        postMap.set(post.id, post);
    });
}

const readUserId = async () => {
    const idType = Number;
    const query = "Enter userId: ";
    const result = await getReadlinePromise(query).then((id) => idType(id));
    rl.close();
    userId = result;
}

const endpoint =  async (res, req) => {
    await readUserId();

    const userIdSuffix = `users/${userId}`;
    const postsByUserIdUrl = `${URL_BASE}${userIdSuffix}/posts`;

    const posts = axios.get(postsByUserIdUrl, config)
      .then(posts => {
        posts = posts.data;

        if (!posts || posts.length === 0) {
            res.status(404).json(`Posts not found for user ${userId}`);
            return;
        }

        let postMap = new Map();
        let resJson = [];

        populatePostMap(posts, postMap);

        const parallelAxiosCommentsRequests = posts.map((post) => getAxiosRequest(getCommentsEndpoint(post.id)));

        axios.all(parallelAxiosCommentsRequests)
            .then(axios.spread((...commentsResponses) => {
                if (commentsResponses.length !== postMap.size) {
                    console.log(`Not every post of user ${userId} has been commented`);
                }

                commentsResponses = commentsResponses.map((response) => response.data);

                commentsResponses.forEach((response, idx) => {
                    if (response) {
                        let postId = response[0].postId;
                        let post = postMap.get(postId);
                        if (post) {
                          post = {...post, "comments": response};
                          resJson.push(post);
                        }
                    }
                });
                res.json(resJson);
            }))
            .catch(errors => {
              console.log("Error while fetching comments... ", errors);
            });

      })
      .catch((error) => {
          console.log(`Error while fetching user's ${userId} posts`, error);
          res.status(404).json("Not found");
      });

}

module.exports = router;
