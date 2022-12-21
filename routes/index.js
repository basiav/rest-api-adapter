const express = require('express');
const router = express.Router();

const axios = require("axios");

// const readline = require('node:readline');
// const { stdin: input, stdout: output } = require('node:process');
const readline = require('readline');

/* GET home page. */
router.get('/', function(req, res, next) {
    main(res, req);
    // res.render('index', { title: 'Express' });
});

const urlBase = 'https://jsonplaceholder.typicode.com/';

const rl = readline.createInterface(process.stdin, process.stdout);

const getReadlinePromise = (query) => {
  return new Promise((resolve, reject) => {
    rl.question(query, (answer) => {
      resolve(answer);
    })
  });
}

let userId;
const commentsLimit = 5;

// const getUserId =  async (Type) => {
//   const query = "Enter userId";
//   const result = await getReadlinePromise(query).then((id) => Type(id));
//   rl.close();
//   return result;
// }
//
// getUserId(Number)
//     .then((r) => console.log("R ", r));

const main =  async (res, req) => {
  const type = Number;
  const query = "Enter userId";

  const result = await getReadlinePromise(query).then((id) => type(id));


  rl.close();

  userId = result;

  const userIdSuffix = `users/${userId}`;
  const postsByUserIdUrl = `${urlBase}${userIdSuffix}/posts`;
  console.log(postsByUserIdUrl);

  const config = {
    headers: {"Accept-Encoding": "gzip,deflate,compress"}
  };

  const applyCommentsLimit = (commentsByPostIdUrl) => {
      return `${commentsByPostIdUrl}&_limit=${commentsLimit}`;
  };

  const getLimitedCommentsUrl = (commentsByPostIdUrl) => {
      return applyCommentsLimit(commentsByPostIdUrl);
  };

  const getCommentsByPostIdUrl = (postId) => {
      return `${urlBase}comments?postId=${postId}`;
  };

  const getCommentsEndpoint = (postId) => {
      return getLimitedCommentsUrl(getCommentsByPostIdUrl(postId))
  }

  const getAxiosRequest = (endpoint) => {
        return axios.get(endpoint, config);
  };

  const posts = axios.get(postsByUserIdUrl, config)
      .then(posts => {
        posts = posts.data;

        // let commentsByPostId = [];
        //   let commentsByPostId = new Map();
          // let comments
          let postMap = new Map();
          let resJson = [];

          posts.forEach(post => {
              postMap.set(post.id, post);
          });

          const parallelAxiosCommentsRequests = posts.map((post) => getAxiosRequest(getCommentsEndpoint(post.id)));

        axios.all(parallelAxiosCommentsRequests)
            .then(axios.spread((...commentsResponses) => {
                if (commentsResponses.length !== postMap.size) {
                    console.log("ERROR WITH CAPACITIES");
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
              console.log("ERROR ", errors);
            });



      })
      .catch((err) => console.log("ERROR ", err));

}

// main();
























module.exports = router;
