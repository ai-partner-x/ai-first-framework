package com.example;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * User service interface
 */
public interface UserService {
  /**
   * Get user by ID
   */
   User getUserById(int id);
  /**
   * Create new user
   */
   User createUser(String name, String email);
  /**
   * Update user
   */
   User updateUser(User user);
  /**
   * Delete user
   */
   boolean deleteUser(int id);
}

/**
 * Test class for TypeScript to Java transpilation
 */
public class User {
  /**
   * User ID
   */
  private int id = 0;
  /**
   * User name
   */
  private String name;
  /**
   * User email
   */
  private String email;
  /**
   * User age
   */
  private int age = 0;
  /**
   * User active status
   */
  private boolean active = false;
  /**
   * User registration date
   */
  private LocalDateTime registeredAt;
  /**
   * User roles
   */
  private List<String> roles = new ArrayList<>();

  /**
   * Constructor
   */
  public User(int id, String name, String email) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.age = 0;
    this.active = true;
    this.registeredAt = LocalDateTime.now();
    this.roles = new ArrayList<>();
    this.roles.add("user");
  }
  /**
   * Get user ID
   */
  public int getId() {
        return this.id;
      }
  /**
   * Set user name
   */
  public void setName(String name) {
        this.name = name;
      }
  /**
   * Get user name
   */
  public String getName() {
        return this.name;
      }
  /**
   * Check if user is active
   */
  public boolean isActive() {
        return this.active;
      }
  /**
   * Add role to user
   */
  public void addRole(String role) {
        if (!this.roles.contains(role)) {
          this.roles.add(role);
        }
      }
  /**
   * Get user roles
   */
  public List<String> getRoles() {
        return this.roles;
      }
}

/**
 * User service implementation
 */
public class UserServiceImpl implements UserService {
  /**
   * Users map
   */
  private Map<Integer, User> users = new HashMap<>();
  /**
   * Next user ID
   */
  private int nextId = 1;
  /**
   * Get user by ID
   */
  public User getUserById(int id) {
        return this.users.get(id) || null;
      }
  /**
   * Create new user
   */
  public User createUser(String name, String email) {
        var user = new User(this.nextId++, name, email);
        this.users.put(user.getId(), user);
        return user;
      }
  /**
   * Update user
   */
  public User updateUser(User user) {
        this.users.put(user.getId(), user);
        return user;
      }
  /**
   * Delete user
   */
  public boolean deleteUser(int id) {
        return this.users.remove(id);
      }
}

public class Functions {
  /**
 * Utility function to validate email
 */
   public static boolean validateEmail(String email) {
  var emailRegex = Pattern.compile("^[^\s@]+@[^\s@]+\.[^\s@]+$");
  return emailRegex.matcher(email).find();
}
}

public class Constants {
  /**
 * Constants
 */
   public static final int MAX_USERS = 100;
   public static final String DEFAULT_ROLE = "user";
   public static final String ADMIN_ROLE = "admin";
}
