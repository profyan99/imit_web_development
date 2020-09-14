package ru.omsu.lab1.grabber;

import ru.omsu.lab1.WebSiteEntity;

import java.io.IOException;

public interface WebSiteGrabber {
    WebSiteEntity fetchWebSite(String url) throws IOException;
}
