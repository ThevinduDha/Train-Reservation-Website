package lk.sliit.lankarail.impl;

import lk.sliit.lankarail.repository.BookingRepository;
import lk.sliit.lankarail.repository.ScheduleRepository;
import lk.sliit.lankarail.repository.TrainRepository;
import lk.sliit.lankarail.repository.UserRepository;
import lk.sliit.lankarail.service.DashboardService;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final TrainRepository trainRepository;
    private final ScheduleRepository scheduleRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public DashboardServiceImpl(TrainRepository trainRepository,
                                ScheduleRepository scheduleRepository,
                                BookingRepository bookingRepository,
                                UserRepository userRepository) {
        this.trainRepository = trainRepository;
        this.scheduleRepository = scheduleRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Map<String, Long> getDashboardStatistics() {
        Map<String, Long> stats = new HashMap<>();

        stats.put("totalTrains", trainRepository.count());
        stats.put("totalSchedules", scheduleRepository.count());
        stats.put("totalBookings", bookingRepository.count());
        stats.put("totalUsers", userRepository.count());

        // You can add more complex stats here later, like "pendingBookings"
        // For now, we'll use totalBookings as a placeholder for "Pending"
        stats.put("pendingBookings", bookingRepository.count());

        return stats;
    }
}