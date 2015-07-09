$(window).load(init);

var request, xml, xmlPersons, xmInlaws, currentXMLMember, memberBackup;
var currentHTMLMember;
var shown;

function init() {
    var tree = $("#family-tree");
    var content = $(tree).first("> .family > .family-member");
    var dx = (content.width() - tree.width()) / 2;
    tree.scrollLeft(dx);

    request = new XMLHttpRequest();
    request.onreadystatechange = requestOnReadyStateChange;
    getXML();

    $("#body").keydown(keylogger);
    $("#infobox-submit").click(submit);
    $("#infobox-background").click(cancelInfobox);
    $("#infobox-cancel").click(cancelInfobox);
    closeInfobox();

    $(".member").click(showInfobox);
    $(".inlaw").click(showInfobox);

    $("#download-button").click(download);
    $("#upload-button").click(uploadClicked);
    var inputFile = $("#input-file");
    inputFile.change(fileChanged);
    inputFile.hide();
}

function keylogger(e) {
    switch (e.keyCode) {
        case 27:
            if (shown && e.keyCode == 27) cancelInfobox();
            break;
    }
}

function getXML() {
    request.open("GET", "familytree.xml");
    request.send();
}
function requestOnReadyStateChange() {
    if (request.readyState != 4) return;
    xml = request.responseXML;
    updateAllXMLMembers();
}

function updateAllXMLMembers() {
    xmlPersons = xml.getElementsByTagName("person");
    xmInlaws = xml.getElementsByTagName("inlaw");
}


function showInfobox() {
    if (shown) return;
    shown = true;
    currentHTMLMember = this;
    var pid = $(this).attr("data-pid");
    updateCurrentXMLMember(pid);
    updateInfobox();
    $("#infobox").show();
}

function cancelInfobox() {
    currentXMLMember.setAttribute("forename", memberBackup.getAttribute("forename"));
    currentXMLMember.setAttribute("surname", memberBackup.getAttribute("surname"));
    currentXMLMember.setAttribute("sex", memberBackup.getAttribute("sex"));
    currentXMLMember.setAttribute("birthDate", memberBackup.getAttribute("birthDate"));
    currentXMLMember.setAttribute("deathDate", memberBackup.getAttribute("deathDate"));
    closeInfobox();
}

function closeInfobox() {
    shown = false;
    $("#infobox").hide();
    $(".infoInput").removeClass("invalid");
}

function updateCurrentXMLMember(pid) {
    for (var i = 0; i < xmlPersons.length + xmInlaws.length; i++) {
        var personI = ( i < xmlPersons.length ) ? xmlPersons.item(i) : xmInlaws.item(i - xmlPersons.length);
        if (personI.getAttribute("pid") === pid) {
            currentXMLMember = personI;
            memberBackup = currentXMLMember.cloneNode(false);
            return;
        }
    }
}

function updateInfobox() {
    $("#input-forename").val(currentXMLMember.getAttribute("forename"));
    $("#input-surname").val(currentXMLMember.getAttribute("surname"));
    if (currentXMLMember.getAttribute("sex") === "M") $("#input-sex-male").prop("checked", "checked");
    else $("#input-sex-female").prop("checked", "checked");
    $("#input-birth-date").val(toLocaleDateString(currentXMLMember.getAttribute("birthDate")));
    $("#input-death-date").val(toLocaleDateString(currentXMLMember.getAttribute("deathDate")));
}

function toLocaleDateString(isoText) {
    if (isoText === "") return isoText;
    else return new Date(isoText).toLocaleDateString();
}

function toIsoDateString(localeText) {
    if (localeText === "") return localeText;

    var iso = localeText.split(".");
    return [iso[2], iso[1], iso[0]].join("-");
}

function submit() {
    var forename = $("#input-forename").val();
    var surname = $("#input-surname").val();
    var sex = $("#input-sex-male").prop("checked") ? "M" : "F";
    var birthDate = $("#input-birth-date").val();
    var deathDate = $("#input-death-date").val();

    if (!validate(forename, birthDate, deathDate)) return;

    currentXMLMember.setAttribute("forename", forename);
    currentXMLMember.setAttribute("surname", surname);
    currentXMLMember.setAttribute("sex", sex);
    console.log(birthDate);
    currentXMLMember.setAttribute("birthDate", toIsoDateString(birthDate));
    currentXMLMember.setAttribute("deathDate", toIsoDateString(deathDate));

    updateInfobox();
    updateCurrentHTMLMember();
    closeInfobox();
}

function validate(forename, birthDate, deathDate) {
    var valid = true;
    if (forename === "") {
        $("#input-forename").addClass("invalid");
        valid = false;
    }
    if (!validateDate(birthDate)) {
        $("#input-birth-date").addClass("invalid");
        valid = false;
    }
    if (!validateDate(deathDate)) {
        $("#input-death-date").addClass("invalid");
        valid = false;
    }
    return valid;
}

function validateDate(localeText) {
    if (localeText === "") return true;

    var comps = localeText.split(".");
    var d = parseInt(comps[0], 10);
    var m = parseInt(comps[1], 10);
    var y = parseInt(comps[2], 10);

    var date = new Date(y, m - 1, d);

    return date.getFullYear() == y && date.getMonth() + 1 == m && date.getDate() == d;
}

function updateCurrentHTMLMember() {
    var htmlChildren = currentHTMLMember.childNodes;
    for (var i = 0, child; child = htmlChildren.item(i); i++) {
        if (child.classList.contains("display-forename")) child.innerHTML = currentXMLMember.getAttribute("forename");
        if (child.classList.contains("display-surname")) child.innerHTML = currentXMLMember.getAttribute("surname");
    }
}

function updateAllHTMLMembers() {
    for (var i = 0; i < xmlPersons.length + xmInlaws.length; i++) {
        var xmlMember = ( i < xmlPersons.length ) ? xmlPersons.item(i) : xmInlaws.item(i - xmlPersons.length);
        var pid = xmlMember.getAttribute("pid");
        var htmlMember = $("#" + pid);
        console.log(htmlMember.children());
        var htmlChildren = htmlMember.childNodes;
        for (var j = 0, child; child = htmlChildren.item(j); j++) {
            if (child.classList.contains("display-forename")) child.innerHTML = xmlMember.getAttribute("forename");
            if (child.classList.contains("display-surname")) child.innerHTML = xmlMember.getAttribute("surname");
        }
    }
    currentHTMLMember = undefined;
}

function uploadClicked() {
    $("#input-file").trigger("click");
}

function fileChanged() {
    console.log("changed");
    if (this.files.length > 1) {
        alert("Bitte nur eine Datei ausw�hlen!");
        return;
    }

    var file = this.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (e) {
        xml = $.parseXML(e.target.result);
        updateAllXMLMembers();
        updateAllHTMLMembers();
        console.log(e.target.result);
    };
    reader.onerror = function () {
        alert("Keine g�ltige XML-Datei!");
    };
    reader.readAsText(file, "UTF-8");
}

function download(e) {
    var xmlText = new XMLSerializer().serializeToString(xml);
    xmlText = xmlText.replace(/\n/g, "\r\n");
    var blob = new Blob([xmlText], {type: "text/xml"});
    saveAs(blob, "familytree.fam")
}
