package lk.sliit.lankarail.repository;

import lk.sliit.lankarail.model.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    @Query("SELECT s FROM Schedule s WHERE s.departureStation = :origin AND s.arrivalStation = :destination AND FUNCTION('DATE', s.departureTime) = :date ORDER BY s.departureTime ASC")
    List<Schedule> findByOriginDestinationAndDate(@Param("origin") String origin, @Param("destination") String destination, @Param("date") LocalDate date);

}