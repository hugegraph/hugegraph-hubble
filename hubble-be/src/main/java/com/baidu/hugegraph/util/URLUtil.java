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

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.exception.ParameterizedException;

public final class URLUtil {

    public static String encode(String text) {
        return encode(text, Constant.CHARSET.name());
    }

    public static String encode(String text, String charset) {
        try {
            return URLEncoder.encode(text, charset);
        } catch (UnsupportedEncodingException e) {
            throw new ParameterizedException("Unsupported encode charset",
                                             charset);
        }
    }

    public static String decode(String text) {
        return decode(text, Constant.CHARSET.name());
    }

    public static String decode(String text, String charset) {
        try {
            return URLDecoder.decode(text, charset);
        } catch (UnsupportedEncodingException e) {
            throw new ParameterizedException("Unsupported decode charset",
                                             charset);
        }
    }
}
