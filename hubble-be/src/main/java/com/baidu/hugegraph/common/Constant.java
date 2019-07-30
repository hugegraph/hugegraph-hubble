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

package com.baidu.hugegraph.common;

import static java.nio.charset.StandardCharsets.UTF_8;

import java.nio.charset.Charset;
import java.util.Set;

import com.google.common.collect.ImmutableSet;

public final class Constant {

    public static final Charset CHARSET = UTF_8;

    public static final String PARAM_LANGUAGE = "lang";
    public static final Set<String> LANGUAGES = ImmutableSet.of(
            "en_US",
            "zh_CN"
    );

    public static final String CONN_NAME_REGEX = "^[A-Za-z][A-Za-z0-9_]{0,47}$";
    public static final String CONN_GRAPH_REGEX = CONN_NAME_REGEX;

    public static final String GREMLIN_NAME_REGEX = "[A-Za-z0-9_]{1,50}";
    public static final int GREMLIN_LIMIT = 100;

    public static final int EXECUTE_HISTORY_LIMIT = 500;
}
