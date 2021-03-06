const express         = require('express');
const methodOverride  = require('method-override');
const cors            = require('cors');
const path            = require('path');
const flash           = require('connect-flash');
const session         = require('express-session');
const cookieParser    = require('cookie-parser');
const db              = require('./db.js');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();

require('dotenv').config({ path: `${__dirname }/.env.${process.env.NODE_ENV}` })

var corsOptions = {
    origin: "*",
    credentials: true 
};
  
app.use(cors(corsOptions));

// setup front-end view engine
app.set('view engine', 'ejs');
app.use('/public', express.static(path.join(__dirname, '../../public')));

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(session({
    secret: "Shh, its a secret!",
    saveUninitialized: false,
    resave: false,
}));
app.use(flash());

app.use(function(req, res, next) {
    res.locals.authError = req.flash('authError');
    next();
});

db.connect().then(result => {
    require('../app.controller')(app);
    init();
})

const port = process.env.PORT || 1336;
const httpServer = require('http').createServer(app);
httpServer.listen(port, () => {
    console.log(`SwiftyCareer running on port ${port}`);
});

// create 3 roles in MongoDB
function init() {
    db.database.collection('Role').estimatedDocumentCount((err, count) => {
        if (!err && count === 0) {
            db.ROLES.forEach(role => {
                db.database.collection('Role').insert({'name': role}).then(result => {
                    console.log(`Added ${result} role to collection`);
                }, error => {
                    console.log(`Error when creating ${role} role: ${error}`);
                });
            });

        }
    });
}