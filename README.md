# 🚂 LankaRail - Train Reservation System

LankaRail is a full-stack, database-driven web application built with Java Spring Boot and Thymeleaf. It provides a complete portal for both administrators to manage the railway system and for passengers to search, book, and manage their train tickets.

This project was built from the ground up, focusing on a secure REST API backend, a clean and responsive frontend, and the practical application of core software design patterns.



---

## 🚀 Core Features

The application is divided into two primary user-facing modules:

### 1. Admin Dashboard
A secure, role-protected portal for system administrators.
* **Live Statistics:** A main dashboard showing real-time counts of Total Trains, Active Schedules, Pending Bookings, and Registered Users.
* **Train Management (CRUD):** Full Create, Read, Update, and Delete functionality for all trains in the fleet.
* **Station Management (CRUD):** Full CRUD for all available train stations.
* **Route Management (CRUD):** Create, Read, Update, and Delete routes. The "Add/Edit" forms use dynamic dropdowns populated from the Stations module to ensure data integrity.
* **Schedule Management (CRUD):** Create, Read, Update, and Delete specific journeys, combining existing trains and routes with custom times and prices.
* **User Management:** View all registered users (passengers and other admins) and the ability to **Enable** or **Disable** their accounts.
* **Booking Management:** A complete overview of all passenger bookings with the critical ability to **Confirm** or **Reject** pending payments.

### 2. Passenger Dashboard
A user-friendly, responsive portal for passengers.
* **Secure Authentication:** Full registration and login system.
* **Dynamic Journey Search:** A powerful search bar to find trains based on **Origin**, **Destination**, and **Date**.
* **Station & Journey Browsing:** An "All Journeys" timetable and a "Station Directory" to help users find available trips.
* **End-to-End Booking:** A simple "Book Now" flow that creates a new booking.
* **Personal Booking Management:** A "My Bookings" section showing a user's complete booking history.
* **Payment & Cancellation:** Users can **"Pay Now"** (marking their booking as `PENDING` for admin review) or **"Cancel"** their unconfirmed bookings.
* **E-Ticket System:** A "View Ticket" button links to a printable ticket page for all confirmed bookings.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Backend** | Java 17, Spring Boot 3 (Spring Web, Spring Data JPA) |
| **Security** | Spring Security 6 (Session-based Authentication, `BCryptPasswordEncoder`) |
| **Database** | MySQL |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **UI Framework** | Bootstrap 5 |
| **Templating** | Thymeleaf (for server-side rendering of all views) |
| **Build Tool** | Apache Maven |

---

## 🎓 Key Concepts & Design Patterns

A major focus of this project was to implement clean, maintainable code using established software design patterns. We have applied one distinct pattern for each of our 6 CRUD modules.

### 1. User Management (CREATE)
* **Pattern:** **Factory Method Pattern**
* **Explanation:** Our `UserService` acts as a factory. When a user registers, the service doesn't just save the data. It *manufactures* a complete `User` object: it hashes the password using `BCrypt`, sets the default `ROLE_MEMBER`, and ensures the account is enabled. This separates the complex creation logic from the controller.

### 2. Train Management (DELETE)
* **Pattern:** **Repository Pattern**
* **Explanation:** Our `TrainService` does not know any SQL. When we delete a train, the service just calls `trainRepository.deleteById()`. The repository is the only layer that knows *how* to speak to the MySQL database to run the `DELETE` command. This perfectly separates our business logic from our data-access logic.

### 3. Schedule Management (UPDATE)
* **Pattern:** **Singleton Pattern**
* **Explanation:** Every `@Service` class in Spring, like our `ScheduleServiceImpl`, is a Singleton. This means when multiple admins are updating schedules at the same time, they are all sharing and using the *one single instance* of the service. This is highly memory-efficient and ensures all operations go through one central, controlled point.

### 4. Station Management (READ)
* **Pattern:** **DTO (Data Transfer Object) Pattern**
* **Explanation:** For our "Read" operations, we use the DTO concept. Our database model (`Station.java`) has internal fields like `createdAt`. The frontend doesn't need this. Our `StationController` returns a JSON object that *only* contains the data the user needs to see (`name` and `city`). This is more secure (hides database structure) and efficient (sends less data).

### 5. Route Management (CREATE)
* **Pattern:** **Dependency Injection (DI) Pattern**
* **Explanation:** Our `RouteController` needs a `RouteService` to work. Instead of the controller creating its own `new RouteService()`, we use Dependency Injection. We simply ask for it in the controller's constructor, and the Spring framework *injects* the one available instance. This decouples our components and makes our code far easier to test.

### 6. Booking Management (CREATE)
* **Pattern:** **Facade Pattern**
* **Explanation:** This is our best example. Creating a booking is very complex. The `BookingService` must talk to the `UserRepository`, `ScheduleRepository`, and `TrainRepository` just to check for seat availability, validate the user, and get the price. Our service acts as a simple "facade." The controller just makes one call: `bookingService.create()`, and the facade hides all that complex coordination.

### 3-Level Validation
The application is secured with three levels of validation:
1.  **Frontend (JS):** Instant feedback for users (e.g., "Passwords do not match").
2.  **API Layer (Model):** Using `@Valid`, `@NotBlank`, and `@Positive` to protect the API from bad data.
3.  **Business Logic (Service):** The smartest validation. For example, the `BookingService` checks the database live to ensure there is enough seat capacity *before* allowing a booking to be created.

---

## 🚀 Getting Started

### Prerequisites
* Java JDK 17 or newer
* Apache Maven
* MySQL Server (or any other standard SQL database)

### 1. Database Setup
1.  Open your MySQL server and create a new database:
    ```sql
    CREATE DATABASE lankarail_db;
    ```
2.  Open the `src/main/resources/application.properties` file.
3.  Update the `spring.datasource.url`, `spring.datasource.username`, and `spring.datasource.password` properties to match your local MySQL installation.
    ```properties
    # Example
    spring.datasource.url=jdbc:mysql://localhost:3306/lankarail_db
    spring.datasource.username=root
    spring.datasource.password=your_password
    ```
4.  Set `spring.jpa.hibernate.ddl-auto=update`. When you run the application, Spring Boot will read your `@Entity` models (like `Train.java`) and automatically create all the tables for you.

### 2. Run the Backend
1.  Open a terminal in the project's root directory.
2.  Run the application using Maven:
    ```sh
    mvn spring-boot:run
    ```
3.  The application will start on `http://localhost:8080`.

### 3. Access the Application
* **Passenger Portal:** `http://localhost:8080/`
* **Admin Portal:** `http://localhost:8080/admin`

