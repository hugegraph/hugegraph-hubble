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

package com.baidu.hugegraph.controller.schema;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.controller.BaseController;
import com.baidu.hugegraph.entity.query.GraphView;
import com.baidu.hugegraph.entity.schema.EdgeLabelEntity;
import com.baidu.hugegraph.entity.schema.LabelUpdateEntity;
import com.baidu.hugegraph.entity.schema.Property;
import com.baidu.hugegraph.entity.schema.PropertyIndex;
import com.baidu.hugegraph.entity.schema.SchemaEntity;
import com.baidu.hugegraph.entity.schema.SchemaLabelEntity;
import com.baidu.hugegraph.entity.schema.Timefiable;
import com.baidu.hugegraph.entity.schema.VertexLabelEntity;
import com.baidu.hugegraph.service.schema.EdgeLabelService;
import com.baidu.hugegraph.service.schema.PropertyKeyService;
import com.baidu.hugegraph.service.schema.VertexLabelService;
import com.baidu.hugegraph.structure.GraphElement;
import com.baidu.hugegraph.structure.constant.IdStrategy;
import com.baidu.hugegraph.structure.graph.Edge;
import com.baidu.hugegraph.structure.graph.Vertex;
import com.baidu.hugegraph.util.Ex;
import com.baidu.hugegraph.util.PageUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;

@RestController
@RequestMapping(Constant.API_VERSION + "graph-connections/{connId}/schema")
public class SchemaController extends BaseController {

    @Autowired
    private VertexLabelService vlService;
    @Autowired
    private EdgeLabelService elService;

    @GetMapping("graphview")
    public GraphView displayInGraphView(@PathVariable("connId") int connId) {
        List<VertexLabelEntity> vertexLabels = this.vlService.list(connId);
        List<EdgeLabelEntity> edgeLabels = this.elService.list(connId);

        List<Vertex> vertices = new ArrayList<>(vertexLabels.size());
        for (VertexLabelEntity entity : vertexLabels) {
            Vertex vertex = new Vertex(entity.getName());
            vertex.id(entity.getName());

            vertex.property("id_strategy", entity.getIdStrategy().string());
            if (entity.getIdStrategy() == IdStrategy.PRIMARY_KEY) {
                vertex.property("primary_keys", entity.getPrimaryKeys());
            }
            this.fillCommonProperties(vertex, entity);
            vertices.add(vertex);
        }

        List<Edge> edges = new ArrayList<>(edgeLabels.size());
        for (EdgeLabelEntity entity : edgeLabels) {
            Edge edge = new Edge(entity.getName());
            String edgeId = String.format(
                            "%s-%s->%s", entity.getSourceLabel(),
                            entity.getName(), entity.getTargetLabel());
            edge.id(edgeId);
            edge.sourceId(entity.getSourceLabel());
            edge.targetId(entity.getTargetLabel());
            edge.property("link_multitimes", entity.isLinkMultiTimes());
            if (entity.isLinkMultiTimes()) {
                edge.property("sort_keys", entity.getSortKeys());
            }
            this.fillCommonProperties(edge, entity);
            edges.add(edge);
        }
        return GraphView.builder().vertices(vertices).edges(edges).build();
    }

    private void fillCommonProperties(GraphElement element,
                                      SchemaLabelEntity entity) {
        Iterator<Property> propIter = entity.getProperties().iterator();
        for (int i = 1; propIter.hasNext(); i++) {
            Property property = propIter.next();
            element.property("property_" + i, property.getName());
        }

        Iterator<PropertyIndex> propIndexIter = entity.getPropertyIndexes()
                                                      .iterator();
        for (int i = 1; propIndexIter.hasNext(); i++) {
            PropertyIndex propertyIndex = propIndexIter.next();
            element.property("propertyindex_" + i, propertyIndex.getName());
        }

        element.property("open_label_index", entity.isOpenLabelIndex());
    }

    public <T extends SchemaEntity> IPage<T> listInPage(
                                             Function<Integer, List<T>> fetcher,
                                             int connId, String content,
                                             String nameOrder,
                                             int pageNo, int pageSize) {
        Boolean nameOrderAsc = null;
        if (!StringUtils.isEmpty(nameOrder)) {
            Ex.check(ORDER_ASC.equals(nameOrder) || ORDER_DESC.equals(nameOrder),
                     "common.name-order.invalid", nameOrder);
            nameOrderAsc = ORDER_ASC.equals(nameOrder);
        }

        List<T> entities = fetcher.apply(connId);
        if (!StringUtils.isEmpty(content)) {
            // Select by content
            entities = entities.stream()
                               .filter(c -> c.getName().contains(content))
                               .collect(Collectors.toList());
            if (nameOrderAsc != null) {
                // order by name
                this.sortByName(entities, nameOrderAsc);
            } else {
                // order by relativity
                this.sortByRelativity(entities, content);
            }
        } else {
            // Select all
            if (nameOrderAsc != null) {
                // order by name
                this.sortByName(entities, nameOrderAsc);
            } else {
                // order by time
                this.sortByCreateTime(entities, false);
            }
        }
        return PageUtil.page(entities, pageNo, pageSize);
    }

    public <T extends SchemaEntity> void sortByName(List<T> entities,
                                                    boolean asc) {
        if (asc) {
            entities.sort(Comparator.comparing(SchemaEntity::getName));
        } else {
            entities.sort(Comparator.comparing(SchemaEntity::getName)
                                    .reversed());
        }
    }

    public <T extends SchemaEntity> void sortByCreateTime(List<T> entities,
                                                          boolean asc) {
        Comparator<T> dateAscComparator = (o1, o2) -> {
            assert o1 instanceof Timefiable;
            assert o2 instanceof Timefiable;
            Date t1 = ((Timefiable) o1).getCreateTime();
            Date t2 = ((Timefiable) o2).getCreateTime();
            if (t1 == null && t2 == null) {
                return 0;
            } else if (t1 == null) {
                // t2 != null
                return -1;
            } else if (t2 == null) {
                // t1 != null
                return 1;
            } else {
                return t1.compareTo(t2);
            }
        };

        if (asc) {
            entities.sort(dateAscComparator);
        } else {
            entities.sort(dateAscComparator.reversed());
        }
    }

    public <T extends SchemaEntity> void sortByRelativity(List<T> entities,
                                                          String content) {
        Comparator<T> occurrencesComparator = (o1, o2) -> {
            String name1 = o1.getName();
            String name2 = o2.getName();
            int count1 = StringUtils.countOccurrencesOf(name1, content);
            int count2 = StringUtils.countOccurrencesOf(name2, content);
            return count2 - count1;
        };
        entities.sort(occurrencesComparator);
    }

    /**
     * Check properties are defined
     */
    public static void checkProperties(PropertyKeyService service,
                                       Set<Property> properties,
                                       boolean mustNullable, int connId) {
        if (properties == null) {
            return;
        }
        for (Property property : properties) {
            String pkName = property.getName();
            service.checkExist(pkName, connId);
            Ex.check(mustNullable, property::isNullable,
                     "schema.propertykey.must-be-nullable");
        }
    }

    public static void checkPropertyIndexes(SchemaLabelEntity entity,
                                            int connId) {
        List<PropertyIndex> propertyIndexes = entity.getPropertyIndexes();
        if (propertyIndexes != null) {
            for (PropertyIndex propertyIndex : propertyIndexes) {
                Ex.check(propertyIndex.getOwner() == null,
                         "common.param.must-be-null", "property_index.owner");
                Ex.check(propertyIndex.getName() != null,
                         "common.param.cannot-be-null", "property_index.name");
                Ex.check(propertyIndex.getSchemaType() != null,
                         "common.param.cannot-be-null", "property_index.type");
                Ex.check(propertyIndex.getFields() != null,
                         "common.param.cannot-be-null", "property_index.fields");
            }
        }
    }

    public static void checkParamsValid(PropertyKeyService service,
                                        LabelUpdateEntity entity, int connId) {
        // All append property should be nullable
        checkProperties(service, entity.getAppendProperties(), true, connId);
    }
}
