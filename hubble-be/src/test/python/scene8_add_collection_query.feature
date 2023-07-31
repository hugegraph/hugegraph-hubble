# language: en
Feature: add hugeGraph's query_collections

  @lxb
  Scenario Outline: add query_connections -- <scene>
    When add query_connections -- 127.0.0.1:8088
    Given add query_connections -- <param>
    Then add query_connections -- <ass>
    Examples:
      | scene            | param                                                                                     | ass            |
      | 正例(name少于等于50字符) | {"name": "testLxb","content" : "g.V(5)"}                                                 | {"status":200,"message":"None"} |
      | name重复             | { "name": "testLxb","content" : "g.V(5)"}                                                | {"status":400,"message":"已存在名字为 testLxb 的 gremlin 语句"} |
      | name存在'-'             | { "name": "test-lxb","content" : "g.V(5)"}                                                | {"status":400,"message":"语句名 test-lxb 不合法，语句名允许字母、数字、中文、下划线，最多48个字符"} |
      | name大于50字符       | { "name": "test2jljfaoqpjjfalfjalfkjaldfjkvmklgjkajflkajflaj435664","content" : "g.V(5)"} | {"status":400,"message":"语句名 test2jljfaoqpjjfalfjalfkjaldfjkvmklgjkajflkajflaj435664 不合法，语句名允许字母、数字、中文、下划线，最多48个字符"} |
      | name不存在          | {"content" : "g.V(5)"}                                                                    | {"status":400,"message":"参数 name 不能为 null 或空"} |
      | name为空           | { "name": "","content" : "g.V(5)"}                                                        | {"status":400,"message":"参数 name 不能为 null 或空"} |
      | content不存在       | { "name": "test0Content"}                                                                 | {"status":400,"message":"参数 content 不能为 null 或空"} |
      | content为空        | { "name": "test1Content","content" : ""}                                                  | {"status":400,"message":"参数 content 不能为 null 或空"} |
      ### 准备测试数据
      | 正例1              | { "name": "testLxb1","content" : "g.V(6)"}                                                | {"status":200,"message":"None"} |
      | 正例2              | { "name": "testLxb2","content" : "g.V(7)"}                                                | {"status":200,"message":"None"} |
      | 正例3              | { "name": "testLxb3","content" : "g.V(8)"}                                                | {"status":200,"message":"None"} |
      | 正例4              | { "name": "testLxb4","content" : "g.V(9)"}                                                | {"status":200,"message":"None"} |
      | 正例5              | { "name": "testLxb5","content" : "g.V(10)"}                                               | {"status":200,"message":"None"} |
      | 正例6              | { "name": "testLxb6","content" : "g.V(11)"}                                               | {"status":200,"message":"None"} |
      | 正例7              | { "name": "testLxb7","content" : "g.V(12)"}                                               | {"status":200,"message":"None"} |
      | 正例8              | { "name": "testLxb8","content" : "g.V(13)"}                                               | {"status":200,"message":"None"} |
      | 正例9              | { "name": "testLxb9","content" : "g.V(14)"}                                               | {"status":200,"message":"None"} |
      | 正例10             | { "name": "testLxb10","content" : "g.V(15)"}                                              | {"status":200,"message":"None"} |
      | 正例11             | { "name": "testLxb11","content" : "g.V(16)"}                                              | {"status":200,"message":"None"} |
      | 正例12             | { "name": "testLxb12","content" : "g.V(17)"}                                              | {"status":200,"message":"None"} |
      | 正例13             | { "name": "testLxb13","content" : "g.V(18)"}                                              | {"status":200,"message":"None"} |







