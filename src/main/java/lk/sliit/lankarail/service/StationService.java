package lk.sliit.lankarail.service;

import lk.sliit.lankarail.model.Station;

import java.util.List;

public interface StationService {
    Station create(Station station);
    Station findById(Long id);
    List<Station> findAll();
    Station update(Long id, Station station);
    void delete(Long id);
}
