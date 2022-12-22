const axios = require("axios");
const {URL_BASE, config, COMMENTS_LIMIT} = require("../config");
const readline = require("readline");

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
};

const getAxiosRequest = (endpoint) => {
    return axios.get(endpoint, config);
};

function declareInitials() {
    return { postMap: new Map(), resJson: []};
}

const populatePostMap = (posts, postMap) => {
    posts.forEach(post => {
        postMap.set(post.id, post);
    });
};

const getReadlinePromise = (query, rl) => {
    return new Promise((resolve, reject) => {
        rl.question(query, (answer) => {
            resolve(answer);
        })
    });
};

const readUserId = async () => {
    const idType = Number;
    const query = "Enter userId: ";
    const rl = readline.createInterface(process.stdin, process.stdout);
    const result = await getReadlinePromise(query, rl).then((id) => idType(id));
    rl.close();
    return result;
};

module.exports = { getCommentsEndpoint, getAxiosRequest, populatePostMap, declareInitials, getReadlinePromise, readUserId };

