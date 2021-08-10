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
        window.localStorage.setItem('currentUser', JSON.stringify(result['user']));
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
    })
}