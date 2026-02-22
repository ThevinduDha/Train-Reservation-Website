<div align="center">
  
# 🚂 LankaRail

### *Modern Train Reservation System for Sri Lanka*

[![Java](https://img.shields.io/badge/Java-17%2B-orange?logo=java)](https://java.com)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.0-brightgreen?logo=spring)](https://spring.io)
[![Spring Security](https://img.shields.io/badge/Spring%20Security-6.0-green?logo=springsecurity)](https://spring.io/projects/spring-security)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)](https://mysql.com)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-purple?logo=bootstrap)](https://getbootstrap.com)
[![Thymeleaf](https://img.shields.io/badge/Thymeleaf-3.0-brightgreen?logo=thymeleaf)](https://www.thymeleaf.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 📖 Table of Contents
- [✨ Overview](#-overview)
- [🎯 Key Features](#-key-features)
  - [👑 Admin Dashboard](#-admin-dashboard)
  - [👤 Passenger Portal](#-passenger-portal)
- [🏗️ Architecture](#️-architecture)
- [💻 Technology Stack](#-technology-stack)
- [🎨 Design Patterns](#-design-patterns)
- [🔒 Security Features](#-security-features)
- [🚀 Quick Start](#-quick-start)
- [📊 Database Schema](#-database-schema)
- [🛣️ API Endpoints](#️-api-endpoints)
- [🧪 Testing](#-testing)
- [📈 Performance Optimizations](#-performance-optimizations)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)
- [👨‍💻 Author](#-author)

---

## ✨ Overview

**LankaRail** is a cutting-edge, full-stack train reservation system built with Java Spring Boot and Thymeleaf. It revolutionizes the railway ticketing experience in Sri Lanka by providing a seamless, secure, and intuitive platform for both administrators and passengers. With a focus on clean architecture and industry-standard design patterns, LankaRail demonstrates enterprise-grade development practices.

---

## 🎯 Key Features

### 👑 Admin Dashboard
*A powerful command center for railway operations*

| Feature | Description | Status |
|---------|-------------|--------|
| **📊 Live Statistics** | Real-time dashboard with total trains, active schedules, pending bookings, and registered users | ✅ |
| **🚆 Train Management** | Complete CRUD operations for train fleet management | ✅ |
| **🚉 Station Management** | Full CRUD for all railway stations | ✅ |
| **🛤️ Route Management** | Create and manage routes with dynamic station dropdowns | ✅ |
| **📅 Schedule Management** | Manage train schedules with custom times and pricing | ✅ |
| **👥 User Management** | Enable/disable user accounts with role-based access | ✅ |
| **💰 Booking Management** | Confirm/reject pending payments with full oversight | ✅ |

### 👤 Passenger Portal
*A seamless booking experience for travelers*

| Feature | Description | Status |
|---------|-------------|--------|
| **🔐 Secure Authentication** | Registration and login with password encryption | ✅ |
| **🔍 Smart Journey Search** | Find trains by origin, destination, and date | ✅ |
| **📋 Journey Timetable** | Browse all available journeys | ✅ |
| **📍 Station Directory** | Complete list of all stations | ✅ |
| **🎫 End-to-End Booking** | Simple 3-step booking process | ✅ |
| **📱 My Bookings** | Personal booking history and management | ✅ |
| **💳 Payment System** | Pay now or cancel unconfirmed bookings | ✅ |
| **🎟️ E-Ticket Generation** | Printable ticket for confirmed bookings | ✅ |

---


---

## 💻 Technology Stack

### Backend Core
| Technology | Purpose |
|------------|---------|
| **Java 17** | Core programming language |
| **Spring Boot 3** | Application framework |
| **Spring MVC** | Web layer architecture |
| **Spring Data JPA** | Database abstraction |
| **Spring Security 6** | Authentication & authorization |
| **Hibernate** | ORM implementation |
| **Maven** | Build & dependency management |

### Frontend Technologies
| Technology | Purpose |
|------------|---------|
| **Thymeleaf** | Server-side templating |
| **Bootstrap 5** | Responsive UI framework |
| **HTML5/CSS3** | Structure & styling |
| **JavaScript ES6+** | Client-side interactivity |

### Database
| Technology | Purpose |
|------------|---------|
| **MySQL** | Primary database |
| **H2** | Testing database |

---

## 🎨 Design Patterns

LankaRail demonstrates six distinct design patterns across its modules:

### 1. 👤 User Management - **Factory Method Pattern**
```java
// The UserService acts as a factory, manufacturing complete User objects
public User registerUser(UserDto userDto) {
    User user = new User();
    user.setUsername(userDto.getUsername());
    user.setPassword(passwordEncoder.encode(userDto.getPassword())); // Hashing
    user.setRole("ROLE_MEMBER"); // Default role
    user.setEnabled(true); // Auto-enabled
    return userRepository.save(user);
}
```
### 2. 🚆 Train Management - Repository Pattern

```java
// Clean separation of business logic from data access
@Service
public class TrainService {
    @Autowired
    private TrainRepository trainRepository; // Only repository knows SQL
    
    public void deleteTrain(Long id) {
        trainRepository.deleteById(id); // No SQL in service!
    }
}
```

### 3. 📅 Schedule Management - Singleton Pattern
```java
// Spring services are singletons by default
@Service
@Scope("singleton") // One instance for entire application
public class ScheduleServiceImpl implements ScheduleService {
    // All admins share this single instance
    // Memory-efficient and centralized control
}
```

### 4. 🚉 Station Management - DTO Pattern
```java

@RestController
public class StationController {
    @GetMapping("/api/stations")
    public List<StationDto> getAllStations() {
        return stationService.findAll().stream()
            .map(station -> new StationDto(
                station.getName(), 
                station.getCity() // Only expose what's needed
            ))
            .collect(Collectors.toList());
    }
}
```
### 5. 🛤️ Route Management - Dependency Injection Pattern
```java

@Controller
public class RouteController {
    private final RouteService routeService;
    
    // Spring injects the service automatically
    public RouteController(RouteService routeService) {
        this.routeService = routeService; // No 'new' keyword!
    }
}
```
### 6. 🎫 Booking Management - Facade Pattern
```java
@Service
public class BookingService {
    // Complex coordination hidden behind simple interface
    public Booking createBooking(BookingRequest request) {
        validateUser(request.getUserId());           // 1. Check user
        checkSeatAvailability(request);              // 2. Verify seats
        calculatePrice(request);                     // 3. Get price
        return saveBooking(request);                 // 4. Save
    } // Controller just calls one method!
}
```

---
### 📈 Performance Optimizations
Database Indexing on frequently queried fields

Connection Pooling with HikariCP

Caching with Spring Cache abstraction

Lazy Loading for JPA relationships

Pagination for large result sets

Gzip Compression for responses

Static Resource Caching for assets

---

### 👨‍💻 Author
<div align="center">
Thevindu Dharmadasa
Full-Stack Developer & Software Architect


---



