package lk.sliit.lankarail.service;

import lk.sliit.lankarail.model.Booking;

import java.util.List;

public interface BookingService {
    Booking create(Booking booking);
    Booking findById(Long id);
    List<Booking> findAll();
    Booking update(Long id, Booking booking); // mainly update seats or status
    void delete(Long id);
}
