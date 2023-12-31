module.exports = function(app, shopData) {

    const redirectLogin = (req, res, next) => {
        if (!req.session.userId ) {
          res.redirect('./login')
        } else { next (); }
    }

    const saltRounds = 10;
    const bcrypt = require('bcrypt');

    const { check, validationResult } = require('express-validator');



    // Handle our routes
    app.get('/',function(req,res){
        res.render('index.ejs', shopData)
    });
    app.get('/about',function(req,res){
        res.render('about.ejs', shopData);
    });
    app.get('/search', redirectLogin, function(req,res){
        res.render("search.ejs", shopData);
    });
    app.get('/search-result', function (req, res) {
        //searching in the database
        //res.send("You searched for: " + req.query.keyword);

        let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });        
    });
    app.get('/register', function (req,res) {
        res.render('register.ejs', shopData);                                                                     
    });                           

    app.post('/registered',[check('email').isEmail()], [check('password').isLength(8)],function (req,res) {
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./register'); }
        else { 

        // Sanitize inputs
        req.body.first = req.sanitize(req.body.first);
        req.body.last = req.sanitize(req.body.last);
        req.body.username = req.sanitize(req.body.username)
        req.body.password = req.sanitize(req.body.password)
        req.body.email = req.sanitize(req.body.email)

        const plainPassword = req.body.password;


        // Hash the password as follows before storing it in the database :
        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {

            if (err) {
                return console.error(err.message);
            }

            // saving data in database
            // Store hashed password in your database.
            let sqlquery = "INSERT INTO userdetails (username, first, last, email, hashedPassword) VALUES (?,?,?,?,?)";
            let newuser = [req.body.username, req.body.first, req.body.last, req.body.email, hashedPassword];



            // execute sql query
            db.query(sqlquery, newuser, (err, result) => {
            if (err) {
               return console.error(err.message);
            } else {
                // saving data in database

                result = 'Hello '+ req.body.first + ' '+ req.body.last +' you are now registered!  We will send an email to you at ' + req.body.email;
                result += 'Your password is: '+ req.body.password +' and your hashed password is: '+ hashedPassword;
                
                res.send(result);            
            }
        
        })
      })
    }
    }); 




    app.get('/list', redirectLogin, function(req, res) {
        let sqlquery = "SELECT * FROM books"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });
    });


    app.get('/listusers', function(req, res) {
        let sqlquery = "SELECT * FROM userdetails"; // query database to get all users
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableUsers:result});
            console.log(newData)
            res.render("listusers.ejs", newData)
         });
    });



    app.get('/addbook', redirectLogin, function (req, res) {
        res.render('addbook.ejs', shopData);
     });
 
     app.post('/bookadded', function (req,res) {
           // saving data in database
           let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
           // execute sql query
           let newrecord = [req.body.name, req.body.price];
           db.query(sqlquery, newrecord, (err, result) => {
             if (err) {
               return console.error(err.message);
             }
             else
             res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.price);
             });
       });    

       app.get('/bargainbooks', function(req, res) {
        let sqlquery = "SELECT * FROM books WHERE price < 20";
        db.query(sqlquery, (err, result) => {
          if (err) {
             res.redirect('./');
          }
          let newData = Object.assign({}, shopData, {availableBooks:result});
          console.log(newData)
          res.render("bargains.ejs", newData)
        });
    });
    
    
    app.get('/login',function(req,res){
        res.render('login.ejs', shopData);
    });




    app.post('/loggedin', function (req,res) {

         // Search for hashed password in your database.
         let sqlquery = "SELECT hashedPassword FROM userdetails WHERE username = ?";
         let user = [req.body.username];


          // execute sql query
          db.query(sqlquery, user, (err, result) => {

            if (err) {
               return console.error(err.message);

            } else if(result.length > 0) {

                //username found in database
                let hashedPassword = result[0].hashedPassword;

                 
        // Compare the password supplied with the password in the database
        bcrypt.compare(req.body.password, hashedPassword, function(err, result) {


            if (err) {
            // error message
            return console.log(err.message);
            }
            else if (result == true) {

                // Save user session here, when login is successful
                req.session.userId = req.body.username;

                // login successful
                let message = 'Hello '+ ' ' + req.body.username + ' you are logged in'                
                res.send(message);   
            }
            else {
                // login unsuccessful
                let message = 'Login unsuccessful, please try again'
                res.send(message);
         }
       })

            } else {

                //No user found in database
                let message  = "username incorrect or not found";
                res.send(message);

            }
  })
}); 

           //page to display form for deleting user

            app.get('/deleteuser', redirectLogin, function (req,res) {
                res.render('deleteuser.ejs', shopData);                                                                     
            });                           


           //delete a user from the database

            app.post('/deleteduser', redirectLogin, function (req,res) {

                // Search for username match in database
                let sqlquery = "DELETE FROM userdetails WHERE username = ?";
                let user = [req.body.username];


                // execute sql query
                db.query(sqlquery, user, (err, result) => {

                if (err) {
                    return console.error(err.message);

                } else if(result.affectedRows > 0) {

                    //this means user was deleted

                    let sqlquery = "SELECT * FROM userdetails"; // query database to get all users
                    // execute sql query
                    db.query(sqlquery, (err, result) => {
                        if (err) {
                            res.redirect('./'); 
                        }
                        let newData = Object.assign({}, shopData, {availableUsers:result});
                        console.log(newData)
                        res.render("listusers.ejs", newData)
                     });

                } else {

                     //No user found in database
                     let message  = "username incorrect or not found";
                     res.send(message);
                   
                }
            })
            }); 
        

            app.get('/logout', redirectLogin, (req,res) => {
                req.session.destroy(err => {
                if (err) {
                  return res.redirect('./')
                }
                res.send('you are now logged out. <a href='+'./'+'>Home</a>');
                })
            })

            app.get('/weather',function(req,res){

                const request = require('request');
          
                let apiKey = 'acb4e7273bd55ab37a91440506ef093c';
                let city = 'london';
                // let city = req.query.city

                let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
                             
                request(url, function (err, response, body) {
                  if(err){
                    console.log('error:', error);
                  } else {
                    // res.send(body);
                    // var weather = JSON.parse(body)

                    // var wmsg = 'It is '+ weather.main.temp + ' degrees in '+ weather.name +
                    //  '! <br> The humidity now is: ' + weather.main.humidity;

                    //  res.send (wmsg);

                     var weather = JSON.parse(body)
                     if (weather!==undefined && weather.main!==undefined) {
                        var wmsg = 'It is '+ weather.main.temp + 
                           ' degrees in '+ weather.name +
                           '!The humidity now is: ' + 
                           weather.main.humidity;
                        //    res.send (wmsg);

                           let data = Object.assign({}, shopData, { message: wmsg });
                           res.render('weather.ejs', data);

                     }
                     else {
                        res.send ("No data found");
                     }
                     
                  } 
                });
            });



        
            app.post('/weatherselected', function (req,res) {

                const request = require('request');
          
                let apiKey = 'acb4e7273bd55ab37a91440506ef093c';
                let city = req.body.city

                let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
                             
                request(url, function (err, response, body) {
                  if(err){
                    console.log('error:', error);
                  } else {
                
                     var weather = JSON.parse(body)
                     if (weather!==undefined && weather.main!==undefined) {

                    
                var wmsg = `It is ${weather.main.temp} degrees in ${weather.name}!<br>
                The humidity now is: ${weather.main.humidity}.<br>
                Wind speed is: ${weather.wind.speed} meters per second`;


                //Include wind direction if available
                if (weather.wind.deg) {
                     wmsg += `, <br>coming from ${weather.wind.deg} degrees.`;
                    }

                        let data = Object.assign({}, shopData, { message: wmsg });
                        res.render('weather.ejs', data);

                     }
                     else {
                        res.send ("No data found");
                     }
                     
                  } 
                });
               

            });    



            app.get('/api', function (req,res) {

                // Query database to get all the books
                // let sqlquery = "SELECT * FROM books"; 
                let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; 
        
                // Execute the sql query
                db.query(sqlquery, (err, result) => {
                    if (err) {
                        res.redirect('./');
                    }
                    // // Return results as a JSON object

                    res.json(result);
                });
            });




            app.get('/tvshows',function(req,res){
            res.render('tvshows.ejs', shopData);
            });





       app.post('/tvshowssearch', function (req,res) {

        const request = require('request');
          
        let term = req.body.search

        let url = `https://api.tvmaze.com/search/shows?q=${term}`


        request(url, function (err, response, body) {
          if(err){
            console.log('error:', error);
          } else {


             var tvshows = JSON.parse(body)

             if (tvshows!==undefined && tvshows.length>0) {

                   let data = Object.assign({}, shopData, {allshows:tvshows});
                   console.log(data)
                   res.render('tvshowresults.ejs', data);

             }
             else {
                res.send ("No data found");
             }
             
          } 
        });
 });    


 

 app.get('/tvshowsselected', function (req,res) {

    const request = require('request');
      
    let term = req.body.search

    let url = `https://api.tvmaze.com/search/shows?q=${term}`


    request(url, function (err, response, body) {
      if(err){
        console.log('error:', error);
      } else {


         var tvshows = JSON.parse(body)

         if (tvshows!==undefined && tvshows.length>0) {

               let data = Object.assign({}, shopData, {allshows:tvshows});
               console.log(data)
               res.render('tvshowresults.ejs', data);

         }
         else {
            res.send ("No data found");
         }
         
      } 
    });
});    




}



















