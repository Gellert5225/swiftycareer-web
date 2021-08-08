const express         = require('express');
const methodOverride  = require('method-override');
const cors            = require('cors');
const path            = require('path');
const cookieParser    = require('cookie-parser');
const db              = require('../model/index.js');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();
const Role = db.role;

require('dotenv').config({ path: `${__dirname }/.env.${process.env.NODE_ENV}` })

var corsOptions = {
    origin: "http://localhost:1336",
    credentials: true 
};
  
app.use(cors(corsOptions));

// setup front-end view engine
app.set('view engine', 'ejs');
app.use('/public', express.static(path.join(__dirname, '../public')));

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
    res.status(200).render('landing');
});

require('../restful/routes/auth')(app);

const port = process.env.PORT || 1336;
const httpServer = require('http').createServer(app);
httpServer.listen(port, () => {
    db.mongoose.connect(
        process.env.MONGODB_URI, 
        {useNewUrlParser: true, useUnifiedTopology: true}
    )
    .then(() => {
        console.log(`SwiftyCareer running on port ${port}`);
        init();
    })
    .catch(error => {
        console.log(error);
    });
});

// create 3 roles in MongoDB
function init() {
    Role.estimatedDocumentCount((err, count) => {
        if (!err && count === 0) {
            db.ROLES.forEach(role => {
                new Role({
                    name: role
                }).save(err => {
                    if (err) console.log(`Error when creating ${role} role: ${err}`);
                    console.log(`Added ${role} role to collection`);
                });
            });

        }
    });
}