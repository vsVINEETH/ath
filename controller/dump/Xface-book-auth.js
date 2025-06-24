const passport = require ("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const userModel = require("../../models/user");

passport.serializeUser((user, done) => {
    done(null, user.id);
}) 

passport.deserializeUser((id, done) => {
    userModel.findById(id).then((user) =>{
        done(null, user)
    })
})

passport.use(
    new FacebookStrategy({
        callbackURL:"http://localhost:3000/auth/facebook/redirect",
        clientID: process.env.FB_APP_ID,
        clientSecret: process.env.FB_APP_SECRET,
        profileFields: ['id', 'displayName','name', 'photos', 'email'],
       
    }, (accessToken, refreshToken, profile, done) => {
   
        console.log(profile,"facebook mpn");
        console.log("hellop")

        userModel.findOne({email:profile._json.email}).then((currentUser) => {
            
            if(currentUser) {
                console.log("user is"+ currentUser);
                done(null, currentUser)
            }else{
                new userModel({
                    first_name:profile._json.first_name,
                    last_name:profile._json.last_name,
                    email:profile._json.email
                }).save().then((newUser) => {
                    console.log('new user created'+ newUser);
                    done(null, newUser)
                })
            }
        })
    })
)

