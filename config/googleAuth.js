require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const userModel = require("../models/user");

passport.serializeUser((user, done) => {
    done(null, user.id);//monogo id
})

passport.deserializeUser((id, done) => {
    userModel.findById(id).then((user) => {
        done(null, user)
    })
})

passport.use(
    new GoogleStrategy({
        callbackURL: process.env.GOOGLE_REDIRECT || "https://ath-87ig.onrender.com/auth/google/redirect",
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        
    }, (accessToken, refreshToken, profile, done) => {
      console.log(profile)
    
          userModel.findOne({email:profile._json.email}).then((currentUser) => {

            if(currentUser){
                console.log('user is'+ currentUser);
                done(null, currentUser)
            }else {
                new userModel({
                    first_name:profile._json.given_name,
                    last_name:profile._json.family_name,
                    email:profile._json.email,
                   
                }).save().then((newUser) => {
                    done(null, newUser)
                })
            }
        })

    })
)
