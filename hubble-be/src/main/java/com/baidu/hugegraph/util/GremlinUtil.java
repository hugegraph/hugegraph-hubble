/*
 * Copyright 2017 HugeGraph Authors
 *
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. The ASF
 * licenses this file to You under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

package com.baidu.hugegraph.util;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang3.StringUtils;

import com.google.common.collect.ImmutableSet;

public final class GremlinUtil {

    private static final Set<String> LIMIT_SUFFIXES = ImmutableSet.of(
            // vertex
            ".V()", ".out()", ".in()", ".both()", ".outV()", ".inV()",
            ".bothV()", ".otherV()",
            // edge
            ".E()", ".outE()", ".inE()", ".bothE()",
            // path
            ".path()", ".simplePath()", ".cyclicPath()",
            // has
            ".hasLabel(STR)", ".hasLabel(NUM)"
    );

    private static final String[] COMPILE_SEARCH_LIST = new String[]{
            ".", "(", ")"
    };
    private static final String[] COMPILE_TARGET_LIST = new String[]{
            "\\.", "\\(", "\\)"
    };

    private static final String[] ESCAPE_SEARCH_LIST = new String[]{
            "\\", "\"", "'", "\n"
    };
    private static final String[] ESCAPE_TARGET_LIST = new String[]{
            "\\\\", "\\\"", "\\'", "\\n"
    };

    private static final Set<Pattern> LIMIT_PATTERNS = compile(LIMIT_SUFFIXES);

    public static String escapeId(Object id) {
        if (!(id instanceof String)) {
            return id.toString();
        }
        String text = (String) id;
        text = StringUtils.replaceEach(text, ESCAPE_SEARCH_LIST,
                                       ESCAPE_TARGET_LIST);
        return (String) escape(text);
    }

    public static Object escape(Object object) {
        if (!(object instanceof String)) {
            return object;
        }
        return StringUtils.wrap((String) object, '\'');
    }

    public static String optimizeLimit(String gremlin, int limit) {
        for (Pattern pattern : LIMIT_PATTERNS) {
            Matcher matcher = pattern.matcher(gremlin);
            if (matcher.find()) {
                return gremlin + ".limit(" + limit + ")";
            }
        }
        return gremlin;
    }

    private static Set<Pattern> compile(Set<String> texts) {
        Set<Pattern> patterns = new LinkedHashSet<>();
        for (String text : texts) {
            String regex = StringUtils.replaceEach(text, COMPILE_SEARCH_LIST,
                                                   COMPILE_TARGET_LIST);
            Pattern pattern;
            // Assume that (STR), (NUM) and () not exist at the same time
            if (text.contains("(STR)")) {
                // single quote
                pattern = compile(regex.replaceAll("STR", "'[\\\\s\\\\S]+'"));
                patterns.add(pattern);
                // double quotes
                pattern = compile(regex.replaceAll("STR", "\"[\\\\s\\\\S]+\""));
                patterns.add(pattern);
            } else if (text.contains("(NUM)")) {
                pattern = compile(regex.replaceAll("NUM", "[\\\\d]+"));
                patterns.add(pattern);
            } else if (text.contains("()")) {
                pattern = compile(regex);
                patterns.add(pattern);
            }
        }
        return patterns;
    }

    private static Pattern compile(String regex) {
        String finalRegex = "(" + regex + ")$";
        return Pattern.compile(finalRegex);
    }
}
