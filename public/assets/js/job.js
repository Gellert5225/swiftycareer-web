$(document).ready(function() {
    $.ajax({
        type: 'get',
        url: '/jobs',
        dataType: 'json'
    })
    .done(function(result) {
        console.log(result);
        if (result.error) {
            console.log('ERROR! ' + result.code + ' ' + result.error);
        } else {
            feeds = result.info;
            popUpPage();
        }
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.log('error when getting feeds');
        console.log('ERROR! Status ' + jqXHR.responseJSON.code + ', ' + jqXHR.responseJSON.error);
    })

});
