async function getId(url) {
 //get the id from the url
    let id = url.split("/")[5];
    return id;
}

module.exports = getId;