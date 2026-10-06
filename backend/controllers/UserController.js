
const UserService = require("../services/UserService")
const RegisterUser = async(req, res)=>{
    try{
        const user = await UserService.RegisterUser(req.body);
        const safeUser = user.toObject();
        delete safeUser.password;
        res.status(201).json({message: "User Registered", user: safeUser});
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
}

//login
const Login = async(req, res)=>{
    try{
        const user= await UserService.LoginUser(req.body);
        if(!user.success){
            return res.status(401).json({message: user.message})
        }
        const safeUser = user.user.toObject();
        delete safeUser.password;
        res.status(200).json({ ...user, user: safeUser });
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
}

//get api
const getUser= async(req, res)=>{
    try{
        const users = await UserService.getUser();
        const safeUsers = users.map((user) => {
            const safeUser = user.toObject();
            delete safeUser.password;
            return safeUser;
        });
        res.json(safeUsers);
    }
    catch(error){
        res.json({message: error.message});
    }
}



//getuserById

const getUserById=async(req, res)=>{

    try{
const user = await UserService.getUserById(req.params.id);
if (!user) {
    return res.status(404).json({message: "User Not Found"});
}
const safeUser = user.toObject();
delete safeUser.password;
res.json(safeUser);

    }
    catch(error){
        res.status(404).json({message: "User Not Found"});
    }
}


//delete api
const deleteUser=async(req, res)=>{

    try{
const user= await UserService.deleteUser(req.params.id, req.body);

res.json({message: "User Delete Success", user});
    }
    catch(error){

        res.status(401).json({message: error.message});
    }
}
  


module.exports = {RegisterUser, Login, getUser, getUserById, deleteUser};


