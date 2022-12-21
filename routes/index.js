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
    main(res, req);
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

// const getUserId =  async (Type) => {
//   const query = "Enter userId";
//   const result = await getReadlinePromise(query).then((id) => Type(id));
//   rl.close();
//   return result;
// }
//
// getUserId(Number)
//     .then((r) => console.log("R ", r));

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

const main =  async (res, req) => {
  const type = Number;
  const query = "Enter userId";

  const result = await getReadlinePromise(query).then((id) => type(id));


  rl.close();

  userId = result;

  const userIdSuffix = `users/${userId}`;
  const postsByUserIdUrl = `${URL_BASE}${userIdSuffix}/posts`;
  
  const posts = axios.get(postsByUserIdUrl, config)
      .then(posts => {
        posts = posts.data;

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

                commentsResponses.forEach((response, index) => {
                    console.log(index);
                    let postId = index + 1;
                    if (response) {
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
      });

}

module.exports = router;
