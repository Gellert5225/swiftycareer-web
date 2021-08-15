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
            _id: result['info']['_id'],
            username: result['info']['username'],
            email: result['info']['email'],
            display_name: result['info']['display_name'],
            bio: result['info']['bio'],
            roles: result['info']['roles'],
            profile_picture: result['info']['profile_picture']
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

    $.ajax({
        url: '/api/rest/auth/signIn',
        dataType: 'json',
        type: 'post',
        data: JSON.stringify(data),
        contentType: 'application/json'
    })
    .done(function(result) {
        window.localStorage.setItem('currentUser', JSON.stringify({
            _id: result['info']['_id'],
            username: result['info']['username'],
            email: result['info']['email'],
            display_name: result['info']['display_name'],
            bio: result['info']['bio'],
            roles: result['info']['roles'],
            profile_picture: result['info']['profile_picture']
        }));
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
    })
}