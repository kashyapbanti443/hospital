const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/UserModel");

// Register User
const RegisterUser = async (data) => {
    const hashedpassword = await bcrypt.hash(data.password, 10);

    const user = await User.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedpassword,
        role: "Patient"
    });
    return user;
};

// Login User
const LoginUser = async (data) => {
    const user = await User.findOne({
        email: data.email
    });

    if (!user) {
        return {
            success: false,
            message: "User Not Found"
        };
    }

    const match = await bcrypt.compare(
        data.password,
        user.password
    );

    if (!match) {
        return {
            success: false,
            message: "Password Invalid"
        };
    }

    const token = jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );

    return {
        success: true,
        message: "User Login Success",
        user,
        token
    };
};

// Get All Users
const getUser = async () => {
    const user = await User.find();

    return user;
};

// Get User By ID
const getUserById = async (id) => {
    return await User.findById(id);
};

// Delete User
const deleteUser = async (id) => {
    return await User.findByIdAndDelete(id);
};

module.exports = {
    RegisterUser,
    LoginUser,
    getUser,
    getUserById,
    deleteUser
};


