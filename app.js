const http = require('http')
const getConnect = require('./src/Utils/blogConnect')
const handleRoute = require('./src/Routes/blogRoutes')
const bodyParser = require('body-parser');


const jsonParser = bodyParser.json();

http.createServer(function (req,res){
    jsonParser(req, res, function () {
        handleRoute(req, res);
    })}).listen(8000,()=>{
    console.log("Server is running at port 8000")
    getConnect()
})