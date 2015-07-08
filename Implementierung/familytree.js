$(window).load(init);

var request, xml, xmlPersons, xmInlaws, currentXMLMember, memberBackup;
var currentHTMLMember;
var shown;

function init() {
    var tree = $("#family-tree");
    tree.scrollLeft(tree.width() / 2);

    request = new XMLHttpRequest();
    request.onreadystatechange = requestOnReadyStateChange;
    updateXML();

    $("#body").keydown(keylogger);
    $("#infobox-submit").click(submit);
    $("#infobox-background").click(cancelInfobox);
    $("#infobox-cancel").click(cancelInfobox);
    closeInfobox();

    $(".member").click(showInfobox);
    $(".inlaw").click(showInfobox);
}

function keylogger(e) {
    switch (e.keyCode) {
        case 27:
            if (shown && e.keyCode == 27) cancelInfobox();
            break;
    }
}

function updateXML() {
    request.open("GET", "familytree.xml");
    request.send();
}
function requestOnReadyStateChange() {
    if (request.readyState != 4) return;
    xml = request.responseXML;
    xmlPersons = xml.getElementsByTagName("person");
    xmInlaws = xml.getElementsByTagName("inlaw");
}


function showInfobox() {
    if (shown) return;
    shown = true;
    currentHTMLMember = this;
    var pid = $(this).attr("data-pid");
    updatePerson(pid);
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

function updatePerson(pid) {
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

    var comps = localeText.split(".");
    var d = parseInt(comps[0], 10);
    var m = parseInt(comps[1], 10);
    var y = parseInt(comps[2], 10);

    return new Date(y, m - 1, d).toISOString();
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
    currentXMLMember.setAttribute("birthDate", toIsoDateString(birthDate));
    currentXMLMember.setAttribute("deathDate", toIsoDateString(deathDate));

    updateInfobox();
    updateHTML();
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

function updateHTML() {
    var htmlChildren = currentHTMLMember.childNodes;
    for (var i = 0, child; child = htmlChildren.item(i); i++) {
        if (child.classList.contains("display-forename")) child.innerHTML = currentXMLMember.getAttribute("forename");
        if (child.classList.contains("display-surname")) child.innerHTML = currentXMLMember.getAttribute("surname");
    }
}

function download() {

}