function signUp(event) {
    event.preventDefault();
    const username = $('#signupform').find('#username').val();
    const email = $('#signupform').find('#email').val();
    const password = $('#signupform').find('#password').val();

    const data = {
        "username": username,
        "email": email,
        "password": password
    }

    $.ajax({
        url: '/api/rest/auth/signup',
        dataType: 'json',
        type: 'post',
        data: JSON.stringify(data),
        contentType: 'application/json'
    })
    .done(function(result) {
        console.log(result);
        window.localStorage.setItem('currentUser', JSON.stringify({
            _id: result['user']['_id'],
            username: result['user']['username'],
            email: result['user']['email'],
            display_name: result['user']['display_name'],
            bio: result['user']['bio'],
            roles: result['user']['roles']
        }));
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
    })
}

function signIn(event) {
    event.preventDefault();
    const username = $('#loginform').find('#username').val();
    const password = $('#loginform').find('#password').val();

    const data = {
        "username": username,
        "password": password
    }

    console.log($('#signupform').find('#username'));

    $.ajax({
        url: '/api/rest/auth/signIn',
        dataType: 'json',
        type: 'post',
        data: JSON.stringify(data),
        contentType: 'application/json'
    })
    .done(function(result) {
        window.localStorage.setItem('currentUser', JSON.stringify({
            _id: result['user']['_id'],
            username: result['user']['username'],
            email: result['user']['email'],
            display_name: result['user']['display_name'],
            bio: result['user']['bio'],
            roles: result['user']['roles'],
            profile_pic: result['user']['profile_pic']
        }));
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
    })
}