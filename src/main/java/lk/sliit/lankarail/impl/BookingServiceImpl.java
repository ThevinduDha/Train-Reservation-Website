package lk.sliit.lankarail.impl;

import lk.sliit.lankarail.model.Booking;
import lk.sliit.lankarail.model.Schedule;
import lk.sliit.lankarail.model.Train;
import lk.sliit.lankarail.model.User;
import lk.sliit.lankarail.repository.BookingRepository;
import lk.sliit.lankarail.repository.ScheduleRepository;
import lk.sliit.lankarail.repository.TrainRepository;
import lk.sliit.lankarail.repository.UserRepository;
import lk.sliit.lankarail.service.BookingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository repo;
    private final UserRepository userRepo;
    private final ScheduleRepository scheduleRepo;
    private final TrainRepository trainRepo;

    public BookingServiceImpl(BookingRepository repo,
                              UserRepository userRepo,
                              ScheduleRepository scheduleRepo,
                              TrainRepository trainRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.scheduleRepo = scheduleRepo;
        this.trainRepo = trainRepo;
    }

    @Override
    @Transactional
    public Booking create(Booking booking) {
        // basic validations already enforced by @Valid in controller, but double-check here
        Long userId = booking.getUserId();
        Long scheduleId = booking.getScheduleId();
        Integer seats = booking.getSeats();

        if (userId == null || scheduleId == null || seats == null) {
            throw new RuntimeException("userId, scheduleId and seats are required");
        }

        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found: " + userId));
        Schedule schedule = scheduleRepo.findById(scheduleId).orElseThrow(() -> new RuntimeException("Schedule not found: " + scheduleId));
        Train train = trainRepo.findById(schedule.getTrainId()).orElseThrow(() -> new RuntimeException("Train not found: " + schedule.getTrainId()));

        // check availability
        Integer already = repo.sumSeatsBySchedule(scheduleId);
        if (already == null) already = 0;
        int available = train.getCapacity() - already;
        if (seats > available) {
            throw new RuntimeException("Not enough seats available. Requested: " + seats + ", Available: " + available);
        }

        // compute total price if schedule has price
        if (schedule.getPrice() != null) {
            booking.setTotalPrice(schedule.getPrice() * seats);
        }

        booking.setStatus("CONFIRMED");
        return repo.save(booking);
    }

    @Override
    public Booking findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Booking not found: " + id));
    }

    @Override
    public List<Booking> findAll() {
        return repo.findAll();
    }

    @Override
    @Transactional
    public Booking update(Long id, Booking booking) {
        Booking existing = findById(id);

        // Allow updating seats (re-check capacity) and status
        if (booking.getSeats() != null) {
            int newSeats = booking.getSeats();
            if (newSeats < 1) throw new RuntimeException("seats: must be at least 1");

            // compute currently booked without this booking
            Integer already = repo.sumSeatsBySchedule(existing.getScheduleId());
            if (already == null) already = 0;
            int seatsExcludingThis = already - existing.getSeats();
            // get train capacity
            Schedule schedule = scheduleRepo.findById(existing.getScheduleId()).orElseThrow(() -> new RuntimeException("Schedule not found: " + existing.getScheduleId()));
            Train train = trainRepo.findById(schedule.getTrainId()).orElseThrow(() -> new RuntimeException("Train not found: " + schedule.getTrainId()));

            int available = train.getCapacity() - seatsExcludingThis;
            if (newSeats > available) {
                throw new RuntimeException("Not enough seats available for update. Requested: " + newSeats + ", Available: " + available);
            }

            existing.setSeats(newSeats);
            if (schedule.getPrice() != null) existing.setTotalPrice(schedule.getPrice() * newSeats);
        }

        if (booking.getStatus() != null) {
            existing.setStatus(booking.getStatus());
        }

        return repo.save(existing);
    }

    @Override
    public void delete(Long id) {
        repo.deleteById(id);
    }
}
