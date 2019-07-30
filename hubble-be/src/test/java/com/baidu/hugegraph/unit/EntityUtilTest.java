package com.baidu.hugegraph.unit;

import java.time.LocalDateTime;

import org.junit.Test;

import com.baidu.hugegraph.entity.GraphConnection;
import com.baidu.hugegraph.testutil.Assert;
import com.baidu.hugegraph.util.EntityUtil;

public class EntityUtilTest {

    @Test
    public void testMerge() throws InterruptedException {
        GraphConnection oldEntity;
        GraphConnection newEntity;
        LocalDateTime dateTime = LocalDateTime.now();
        oldEntity = new GraphConnection(1, "conn1", "graph1", "host1", 8001,
                                        "", "", dateTime);
        Thread.sleep(10);
        newEntity = new GraphConnection(2, "conn2", "graph2", "host2", 8002,
                                        "u", "p", LocalDateTime.now());

        GraphConnection entity = EntityUtil.merge(oldEntity, newEntity);
        Assert.assertEquals(oldEntity.getId(), entity.getId());
        Assert.assertEquals(newEntity.getName(), entity.getName());
        Assert.assertEquals(newEntity.getGraph(), entity.getGraph());
        Assert.assertEquals(newEntity.getHost(), entity.getHost());
        Assert.assertEquals(newEntity.getPort(), entity.getPort());
        Assert.assertEquals(newEntity.getUsername(), entity.getUsername());
        Assert.assertEquals(newEntity.getPassword(), entity.getPassword());
        Assert.assertEquals(oldEntity.getCreateTime(), entity.getCreateTime());
    }
}
