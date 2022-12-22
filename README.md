# rest-api-adapter
Express.js application using Axios as an HTTP client. Serves as an adapter for the fake REST api.
* https://expressjs.com/
* https://axios-http.com/docs/intro
* https://jsonplaceholder.typicode.com/


### Running the project
`npm start`
or 
`npm install && npm start`

Then navigate to http://localhost:3000/

### Use
For a given user id, it fetches the user's posts with their comments, limited up to 5, and returns it in a JSON format.
GET method for `http://localhost:3000/userId`, where `userId` serves as a variable.

Example use cases:
* GET `http://localhost:3000/6` returns all posts with comments corresponding to them for user with id=6
* GET `http://localhost:3000/` you will be prompted that no user id has been given and will be asked to input it through the console




