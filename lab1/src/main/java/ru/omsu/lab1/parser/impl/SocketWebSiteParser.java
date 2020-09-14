package ru.omsu.lab1.parser.impl;

import ru.omsu.lab1.WebSiteEntity;

public class SocketWebSiteParser {
    public WebSiteEntity parse(String webSitePayload) {
        String[] parsedWebSite = webSitePayload.split("\n\n");
        return new WebSiteEntity(parsedWebSite[0], parsedWebSite[1]);
    }
}
