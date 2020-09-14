package ru.omsu.lab1.parser.impl;

import ru.omsu.lab1.WebSiteEntity;

import java.util.List;
import java.util.Map;

public class UrlConnectionWebsiteParser {
    public WebSiteEntity parse(String webSiteBody, Map<String, List<String>> headersMap) {
        return new WebSiteEntity(convertHeadersToTheString(headersMap), webSiteBody);
    }

    private String convertHeadersToTheString(Map<String, List<String>> headersMap) {
        StringBuilder stringBuilder = new StringBuilder();
        for (Map.Entry<String, List<String>> entry : headersMap.entrySet()) {
            stringBuilder
                    .append(entry.getKey())
                    .append(": ")
                    .append(entry.getValue().stream().reduce(String::concat))
                    .append("\n");
        }
        return stringBuilder.toString();
    }

}
