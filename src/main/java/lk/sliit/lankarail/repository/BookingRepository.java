package lk.sliit.lankarail.repository;

import lk.sliit.lankarail.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    // sum of seats already booked for a schedule (only confirmed)
    @Query("SELECT COALESCE(SUM(b.seats), 0) FROM Booking b WHERE b.scheduleId = :scheduleId AND b.status = 'CONFIRMED'")
    Integer sumSeatsBySchedule(@Param("scheduleId") Long scheduleId);
}
