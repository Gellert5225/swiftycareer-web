var resizeImage = function (settings) {
    var file = settings.file;
    var maxSize = settings.maxSize;
    var reader = new FileReader();
    var image = new Image();
    var canvas = document.createElement('canvas');
    var dataURItoBlob = function (dataURI) {
        var bytes = dataURI.split(',')[0].indexOf('base64') >= 0 ?
            atob(dataURI.split(',')[1]) :
            unescape(dataURI.split(',')[1]);
        var mime = dataURI.split(',')[0].split(':')[1].split(';')[0];
        var max = bytes.length;
        var ia = new Uint8Array(max);
        for (var i = 0; i < max; i++)
            ia[i] = bytes.charCodeAt(i);
        return new Blob([ia], { type: mime });
    };
    var resize = function () {
        var width = image.width;
        var height = image.height;
        if (width > height) {
            if (width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
            }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(image, 0, 0, width, height);
        var dataUrl = canvas.toDataURL('image/jpeg');
        return dataURItoBlob(dataUrl);
    };
    return new Promise(function (ok, no) {
        if (!file.type.match(/image.*/)) {
            no(new Error("Not an image"));
            return;
        }
        reader.onload = function (readerEvent) {
            image.onload = function () { return ok(resize()); };
            image.src = readerEvent.target.result;
        };
        reader.readAsDataURL(file);
    });
};

var feedImages = [];
$('#postFeedBox').click(function() {
    $('#postFeedModal').modal('show'); 
    if (feedImages.length >= 5) {
        $("#image-selector").prop('disabled', true);
        $('.custom-file-upload').css('cursor', 'not-allowed');
    } else {
        $("#image-selector").prop('disabled', false);
        $('.custom-file-upload').css('cursor', 'pointer');
    }
});

if(window.File && window.FileList && window.FileReader) {
    var filesInput = document.getElementById("image-selector");
    filesInput.addEventListener("change", function(event){
        var files = event.target.files;
        var output = document.getElementById("image-preview");
        
        for(var i = 0; i < files.length; i++) {
            var file = files[i];
            resizeImage({
                file: file,
                maxSize: 1000
            }).then(function (resizedImage) {
                feedImages.push({blob: resizedImage, name: file.name});
                if (feedImages.length >= 5) {
                    $("#image-selector").prop('disabled', true);
                    $('.custom-file-upload').css('cursor', 'not-allowed');
                } else {
                    $("#image-selector").prop('disabled', false);
                    $('.custom-file-upload').css('cursor', 'pointer');
                }
    
                var picReader = new FileReader();
                picReader.addEventListener("load",function(event){
                    var picFile = event.target;
                    var container = document.createElement('div');
                    container.className = 'thumbnailContainer';
                    var div = document.createElement('img');
                    div.src = picFile.result;
                    div.className = 'thumbnail';
                    var del = document.createElement('img');
                    del.src = '../../public/assets/images/delete.png'
                    del.id = 'delete-image';
                    del.addEventListener('click', function() {
                        var temp = del.parentNode;
                        var i= 0;
                        while((temp = temp.previousSibling) != null){ 
                            i++;
                        }
                        feedImages.splice(i - 1, 1);
                        del.parentElement.remove();
                        if (feedImages.length < 5) {
                            $("#image-selector").prop('disabled', false);
                            $('.custom-file-upload').css('cursor', 'pointer');
                        }
                    }, false);
                    container.insertBefore(div, null);
                    container.appendChild(del);
                    output.insertBefore(container, null);
                });
                //Read the image
                picReader.readAsDataURL(file);
            }).catch(function (err) {
                console.error(err);
            });
        }
    });
} else {
    console.log("Your browser does not support File API");
}

var quill_postFeed = new Quill('#postFeedEditor', {
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }]
        ]
    },
    placeholder: 'What\'s on your mind?',
    theme: 'snow'
});
quill_postFeed.format('color', 'white');

function linkify(text) {
    var urlRegex =/(((https?:\/\/)|(www\.))[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        if (url.startsWith('http://') || url.startsWith('https://'))
            return '<a href="' + url + '">' + url + '</a>';
        else 
            return '<a href="//' + url + '">' + url + '</a>';
    });
}

var feeds = []

var currentUser = JSON.parse(window.localStorage.getItem('currentUser'));

var newCommentIndex = -1;
var newFeedIndex = -1;

$(document).ready(function() {
    // console.log("Page loaded");
    // let img = $('#postFeed-profileImg');
    // let navbarProfileImg = $('#navbarProfileImage');
    // let navbarProfileName = $('#navbar-profileDropdownUsername');
    // img.attr('src', `/api/files/${currentUser['profile_picture']}`);
    // navbarProfileImg.attr('src', `/api/files/${currentUser['profile_picture']}`);
    // navbarProfileName.text(currentUser['display_name']);

    $.ajax({
        type: 'get',
        url: '/feeds',
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

function popUpPage() {
    feeds.forEach((feed, index) => {
        $('#feed-mid-col').append(generateFeedHTML(index, feed));
        var quill = new Quill('#cardTextView' + index, {
            modules: {
                toolbar: null,
                clipboard: {
                    matchVisual: false
                }
            },
            theme: 'snow'
        });
        quill.enable(false);
        quill.format('color', 'white');
        quill.root.innerHTML = linkify(feed.text);
    });
}

function generateFeedHTML(feedIndex, feed) {
    var feedHTML = `
        <div id="card-text${feedIndex}" style="display: none;">
            ${feed.text}
        </div>
        <div class="card feed-card" id="feed-card${feedIndex}" data-feedId="${feed._id}" style="width: auto;">
            <div class="card-body feed-card-body">
                <div style="display: inline-block; width: 80%;">
                    <img id="feed-card-profileImg" src="/api/files/${feed.author[0].profile_picture}">
                    <h5 class="card-title feed-card-username">${feed.author[0].display_name}</h5>
                    <h6 class="card-subtitle mb-2 feed-card-authorPosition">${feed.author[0].bio}</h6>
                    <p class="card-subtitle mb-2 feed-timeStamp" id="feed-timeStamp${feedIndex-1}">${calculateTimeStamp(feed.created_at)}</p>
                </div>
                <div id="feed-cardTime">
                    <div class="btn-group">
                        <button class="feed-moreButton" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <img src="../public/assets/images/dot.png" width=20 height=20>
                        </button>
                        <ul class="dropdown-menu feed-cardDropdownMenu">
                            <li><a class="dropdown-item feed-cardDropdownItem" href="#">Report this post</a></li>
                        </ul>
                    </div>
                </div>
                <div class="feed-cardTextView" id="cardTextView${feedIndex}" style="border-style: none;"></div>
                ${(feed.images.length > 0) ?
                    `<div id="carouselExampleIndicators${feedIndex}" class="carousel slide" data-interval="false">
                        ${(feed.images.length > 1) ? 
                            `<div class="carousel-indicators">
                                ${feed.images.map((image, index) => {
                                    return index == 0 ? `
                                        <button type="button" data-bs-target="#carouselExampleIndicators${feedIndex}" data-bs-slide-to="${index}" class="active" aria-current="true" aria-label="Slide ${index}">
                                        </button>` 
                                        : `
                                        <button type="button" data-bs-target="#carouselExampleIndicators${feedIndex}" data-bs-slide-to="${index}" aria-label="Slide ${index}">
                                        </button>`
                                }).join('')}
                            </div>`
                        : ``}
                        <div class="carousel-inner">
                            ${feed.images.map((image, index) => {
                                return index == 0 ? 
                                    `<div class="carousel-item active feedImgPlaceholder">
                                        <img src="api/files/${image}" class="d-block w-100">
                                    </div>` : 
                                    `<div class="carousel-item feedImgPlaceholder">
                                        <img src="api/files/${image}" class="d-block w-100">
                                    </div>`
                            }).join('')}
                        </div>
                        ${(feed.images.length > 1) ? `
                            <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators${feedIndex}" data-bs-slide="prev">
                                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            </button>
                            <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators${feedIndex}" data-bs-slide="next">
                                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            </button>`
                        : ''}
                    </div>`
                :``}
            <hr class="feed-card-divider">
            </div>
            <div class="row">
                <div class="col-4" id="like-col">
                    <div class="utility-col-wrapper like-col-wrapper" id="like-col-wrapper${feedIndex}" onclick="handleLike(event)">
                        <img src=${feed.liked_user_ids.includes(currentUser._id) ? "../public/assets/images/like-selected.png" :  "../public/assets/images/like.png"} class="feed-utility-img">
                        <p class="numberOf" id="numberOfLikes">${feed.like_count}</p>
                    </div>
                </div>
                <div class="col-4" id="comment-col">
                    <div class="utility-col-wrapper comment-col-wrapper" id="comment-col-wrapper${feedIndex}" onclick="handleComment(event)">
                        <img src="../public/assets/images/comment.png" class="feed-utility-img">
                        <p class="numberOf" id="numberOfComments">${feed.comment_count}</p>
                    </div>
                </div>
                <div class="col-4" id="repost-col">
                    <div class="utility-col-wrapper repost-col-wrapper" id="repost-col-wrapper${feedIndex}">
                        <img src="../public/assets/images/repost.png" class="feed-utility-img">
                        <p class="numberOf" id="numberOfReposts">${feed.share_count}</p>
                    </div>
                </div>
            </div>
            <div id="commentSection${feedIndex}" class="commentSection">
                <hr class="feed-card-divider">
                <div id="postCommentWrapper">
                    <img id="comment-profileImg" src="/api/files/${currentUser['profile_picture']}">
                    <form class="commentTextForm" id="commentTextForm${feedIndex}" method="POST" action="/feed/${feed._id}/comments">
                        <textarea placeholder="Write your comment..." name="commentText" class="commentTextArea" id="commentTextArea${feedIndex}" oninput="auto_grow(this)" onkeypress="postComment(event)"></textarea>
                    </form>
                </div>
                <div class="circular-loader" id="comment-loader<%= feedIndex %>"></div>
            </div>
        </div>
    `;
    
    return feedHTML;
}

// handle time stamp
function calculateTimeStamp(date) {
    const _MS_PER_HOUR = 1000 * 60 * 60;
    const now = Date.now();
    var secondDiff = Math.floor((now - date) / 1000);
    var minuteDiff = Math.floor(secondDiff / 60);
    var hourDiff = Math.floor((now - date) / _MS_PER_HOUR);
    var dayDiff = Math.floor(hourDiff / 24);

    var temp = new Date(0);
    temp.setUTCSeconds(date/1000);
    var localDateFull = temp.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });

    if (secondDiff < 60) 
        return 'Just Now';
    if (minuteDiff < 60)
        return String(minuteDiff) + ' min';
    if (hourDiff < 24) 
        return String(hourDiff) + ' hour';
    if (dayDiff < 6) 
        return String(dayDiff) + ' day';
    return String(localDateFull);
}

// post feed
function postFeed(event) {
    var post = JSON.stringify(quill_postFeed.getContents());
    var myFormData = new FormData();
    feedImages.forEach((image, index) => {
        myFormData.append('feedImage', image.blob, image.name);
    });
    myFormData.append('authorId', JSON.parse(window.localStorage.getItem('currentUser'))._id);
    myFormData.append('text_JSON', post);
    myFormData.append('text_HTML', $('#postFeedEditor .ql-editor').html());
    $('#postFeedModal').modal('hide');
    feedImages = [];

    $.ajax({
        type: "post",
        url: '/feeds',
        data: myFormData,
        cache: false,
        contentType: false,
        processData: false
    })
    .done(function(result) {
        if (result.error) {
            console.log('ERROR! ' + result.error.code + ' ' + result.error.message);
        } else {
            result.info.author = currentUser;
            $(generateFeedHTML(newFeedIndex, result.info)).insertAfter('#postFeedWrapper');
            var quill = new Quill('#cardTextView' + newFeedIndex, {
                modules: {
                    toolbar: null,
                    clipboard: {
                        matchVisual: false
                    }
                },
                theme: 'snow'
            });
            quill.enable(false);
            quill.format('color', 'white');
            quill.root.innerHTML = linkify(result.info.text);
        }
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.log('error posting feed');
        console.log('ERROR! Status ' + jqXHR.responseJSON.code + ', ' + jqXHR.responseJSON.error);
    })
}

// handle likes
function handleLike(event) {
    const clickedElement = $(event.target);
    const targetElement = clickedElement.closest('.like-col-wrapper');
    const feedId = targetElement.parent().parent().parent().attr('data-feedId');

    var amount = 0;
    if (targetElement.find('img').attr('src') == "../public/assets/images/like.png") {
        targetElement.find('img').attr('src', '../public/assets/images/like-selected.png')
        amount = 1;
    } else {
        targetElement.find('img').attr('src', '../public/assets/images/like.png')
        amount = -1;
    }

    var prevLikes = parseInt(targetElement.find('p').text());
    targetElement.find('p').text(prevLikes + amount);

    $.ajax({                    
        url: '/feeds/' + feedId + '/likes',     
        type: 'put',
        data : {
            amount : amount,
            userId: currentUser._id
        }
    })
    .done(function(data) {
        //console.log(data);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
    });
}

// handle comments
function handleComment(event) {
    const clickedElement = $(event.target);
    const targetElement = clickedElement.closest('.comment-col-wrapper');
    const parent = targetElement.parent().parent().parent();
    const feedId = parent.attr('data-feedId');
    const feedIndex = parseInt(parent.attr('id')[parent.attr('id').length-1]);
    const commentSection = parent.find('.commentSection');
    const circularLoader = commentSection.find('.circular-loader');
    
    if (commentSection.css("display") != "block") {
        commentSection.show();
        $.ajax({                    
            url: '/feeds/' + feedId + '/comments',     
            type: 'get',
            dataType: 'json'
        })
        .done(function(data) {
            if (data.error) {
                console.log('ERROR! ' + data.error.code + ' ' + data.error.message);
            } else {
                circularLoader.hide();
                var comments = data.info;
                comments.forEach((comment, index) => {
                    commentSection.append(generateCommentHTML(comment, feedIndex, index));
                    var quill = new Quill('#comment-cardTextView' + feedIndex + '-' + index, {
                        modules: {
                            toolbar: null,
                            clipboard: {
                                matchVisual: false
                            }
                        },
                        theme: 'snow'
                    });
                    quill.enable(false);
                    $('#comment-cardTextView' + feedIndex + '-' + index).find('p').append(linkify(comment.text));
                });
            }
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            circularLoader.hide();
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        });
    }
}

// generate comment HTML
function generateCommentHTML(comment, feedIndex, commentIndex) {
    var html = `
        <div id="comment-text${feedIndex}-${commentIndex}" style="display: none;">
            ${comment.text}
        </div>
        <div id="comment${feedIndex}-${commentIndex}" class="comment-row">
            <img id="comment-profileImg" src="/api/files/${comment.author.profile_picture}">
            <div class="card feed-card comment-card" style="width: auto;">
                <div class="card-body feed-card-body comment-card-body">
                    <div style="display: inline-block; width: 80%;">
                        <h5 class="card-title feed-card-username comment-card-username">${comment.author.display_name}</h5>
                        <h6 class="card-subtitle mb-2 feed-card-authorPosition comment-card-authorPosition">${comment.author.position}</h6>
                    </div>
                    <div id="feed-cardTime">
                        <div class="btn-group">
                            <button class="feed-moreButton comment-moreButton" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <img src="../public/assets/images/dot.png" width=15 height=15>
                            </button>
                            <ul class="dropdown-menu feed-cardDropdownMenu">
                                <li><a class="dropdown-item feed-cardDropdownItem" href="#">Report this comment</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="feed-cardTextView comment-cardTextView" id="comment-cardTextView${feedIndex}-${commentIndex}" style="border-style: none;"></div>
                </div>
            </div>
        </div>
    `;
    return html;
}

// post comment 
function postComment(event) {
    if (event.keyCode == 13 && !event.shiftKey) {
        event.preventDefault();
        const textarea = $(event.target);
        const parent = textarea.parent().parent().parent();
        const circularLoader = parent.find('.circular-loader');
        const commentText = $('<div>').text(textarea.val()).html();
        const feedId = parent.parent().attr('data-feedId');
        const feedIndex = parseInt(parent.parent().attr('id')[parent.parent().attr('id').length-1]);

        if (commentText != '') {
            textarea.val('');
            textarea.css('height', '37px');
            circularLoader.show();

            $.ajax({
                type: "post",
                url: '/feeds/' + feedId + '/comments',
                data: {
                  text: commentText,
                  commenter: currentUser._id
                }
            })
            .done(function(data) {
                circularLoader.hide();
                $(generateCommentHTML(data.info, feedIndex, newCommentIndex)).insertAfter(parent.find('form'));
                var quill = new Quill('#comment-cardTextView' + feedIndex + '-' + newCommentIndex, {
                    modules: {
                        toolbar: null,
                        clipboard: {
                            matchVisual: false
                        }
                    },
                    theme: 'snow'
                });
                quill.enable(false);
                quill.root.innerHTML = linkify(data.info.text);
                //$('#comment-cardTextView' + feedIndex + '-' + newCommentIndex).find('p').append(linkify(data.info.text));
                newCommentIndex--;
            })
        }
    }
}

// auto grow comment textbox
function auto_grow(element) {
    element.style.height = "37px";
    element.style.height = (element.scrollHeight)+"px";
}
