const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullname: {
        type: String, 
        defaut: ""
    },
    firstname: {
        type: String,
        default: ""
    },
    lastname: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        default: ""
    },
    phone: {
        type: Number
    },
    location: {
        type: String
    },
    fbTokens: Array, 
    facebook: {
        type: String
    },
    google: {
        type: String
    },
    instagram: {
        type: String
    }
});

module.exports = mongoose.model("user", userSchema);