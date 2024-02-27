const blogController = require('../Controller/blogController')

async function handleRoute(req,res){
    const { method,url } = req;
    switch(url){
        case '/signup' : 
            if(method === 'POST' ){
                   return await blogController.signup(req,res);
            } else {
                res.writeHead(405, { 'Content-Type': 'text/plain' });
                res.end('405 Method not allowed');
            }
            break;

        case '/login' : 
            if(method === 'POST'){
                return await blogController.login(req,res);
            }else {
                res.writeHead(405,{'Content-Type' : 'text/plain'})
                res.end('405 Method not allowed')
            }
            break;
        
            case '/verify_otp' : 
            if(method === 'POST'){
                return await blogController.verify_otp(req,res)
            }else{
                res.writeHead(405,{'Content-type' : 'text/plain'})
                res.end('405 Method not Found')
            }
            break;

            case '/resend_otp' :
                if(method === 'POST'){
                    return blogController.resend_otp(req,res)
                }else{
                    res.writeHead(405,{'Content-Type' : 'text/plain'})
                    res.end('405 Method not Found')
                }
                break;
            
                case '/forgotPassword':
                    if(method === 'POST'){
                        return blogController.forgotPassword(req,res)
                    }
                    else {
                        res.writeHead(405,{'Content-Type' : 'text/plain'})
                        res.end('405 Method not Found')
                    }
                    break;
                
                    case '/changePassword':
                        if(method === 'POST'){
                            return blogController.changePassword(req,res)
                        }else{
                            res.writeHead(405,{'Content-Type' : 'text/plain'})
                            res.end('405 Method not Found')
                        }
                    break;
    }
}      


module.exports = handleRoute;