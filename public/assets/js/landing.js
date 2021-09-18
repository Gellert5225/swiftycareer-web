// $(document).ready(function() {
//     window.location.replace("/");
// });

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
        var html = ` 
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Error!</strong> ${jqXHR.responseJSON.error}.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $(html).insertAfter('#signupModal-header');
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
        if (!result.error) {
            window.location.replace("/feed");
            window.localStorage.setItem('currentUser', JSON.stringify({
                _id: result['info']['_id'],
                username: result['info']['username'],
                email: result['info']['email'],
                display_name: result['info']['display_name'],
                bio: result['info']['bio'],
                roles: result['info']['roles'],
                profile_picture: result['info']['profile_picture']
            }));
        }
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        var html = ` 
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Error!</strong> ${jqXHR.responseJSON.error}.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $(html).insertAfter('#loginModal-header');
        //window.location.replace("/");
    })
}