# language: en
Feature: delete hugeGraph's connections

  @lxb
  Scenario Outline: delete hugeGraph's connections -- <scene>
    When delete hugeGraph's connections -- 127.0.0.1:8088
    Given delete hugeGraph's connections
    Then delete hugeGraph's connections -- <ass>
    Examples:
      | scene | ass |
      | 删除图链接 | {"status":200, "message":"None"} |
