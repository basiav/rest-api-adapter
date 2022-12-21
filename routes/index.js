const express = require('express');
const router = express.Router();

const axios = require("axios");

// const readline = require('node:readline');
// const { stdin: input, stdout: output } = require('node:process');
const readline = require('readline');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
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

// const getUserId =  async (Type) => {
//   const query = "Enter userId";
//   const result = await getReadlinePromise(query).then((id) => Type(id));
//   rl.close();
//   return result;
// }
//
// getUserId(Number)
//     .then((r) => console.log("R ", r));

const main =  async () => {
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

  const posts = axios.get(postsByUserIdUrl, config)
      .then(r => console.log(r.data))
      .catch((err) => console.log("ERROR ", err));

}

main();
























module.exports = router;
