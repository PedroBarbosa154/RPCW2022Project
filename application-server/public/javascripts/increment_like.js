$(function () {
    $("#likeBtn").click(function () {
        let x = parseInt($("#num_likes").val())
        $("#num_likes").val(x+1)
    });
    $("#dislikeBtn").click(function () {
        let x = parseInt($("#num_likes").val())
        $("#num_likes").val(x-1)
    });
})