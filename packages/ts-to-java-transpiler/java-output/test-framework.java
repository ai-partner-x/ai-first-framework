package com.example;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.cloud.stream.annotation.Output;
import org.springframework.cloud.stream.annotation.StreamListener;
import org.springframework.data.redis.core.HashKey;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;

// Redis repository example
public interface UserSessionRepository {
   List<UserSession> findByUserId(int userId);
   void deleteByExpiresAtBefore(LocalDateTime date);
}

// Redis entity example
@RedisHash('userSessions')
public class UserSession {
  @HashKey
  private String id;
  private int userId = 0;
  private String token;
  private LocalDateTime createdAt;
  private LocalDateTime expiresAt;
}

// MQ producer example
public class OrderMessageProducer {
  @Output('orderOutput')
  private Object orderOutput;
  public void sendOrderMessage(int orderId, String status) {
    var message = new HashMap<String, Object>() {{ put("orderId", orderId); put("status", status); put("timestamp", LocalDateTime.now()); }};
        this.orderOutput.send(message);
  }
}

// MQ consumer example
public class OrderMessageConsumer {
  @StreamListener('orderInput')
  public void handleOrderMessage(Object message) {
    System.out.println("Received order message:", message);
        Pattern.compile("") Process message
  }
}

// Security example
public class UserController {
  @PreAuthorize('hasRole("ADMIN")')
  public List<Object> getUsers() {
    return new ArrayList<>();
  }
  @Secured('ROLE_USER')
  public Object getUserById(int id) {
    return new HashMap<String, Object>() {{ put("id", id); put("name", "John"); }};
  }
  @PostAuthorize('returnObject.owner == authentication.name')
  public Object getOrder(int id) {
    return new HashMap<String, Object>() {{ put("id", id); put("owner", "user123"); }};
  }
}

