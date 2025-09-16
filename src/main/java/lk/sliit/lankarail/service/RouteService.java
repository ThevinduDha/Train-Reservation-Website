package lk.sliit.lankarail.service;

import lk.sliit.lankarail.model.Route;
import java.util.List;

public interface RouteService {
    Route create(Route route);
    Route findById(Long id);
    List<Route> findAll();
    Route update(Long id, Route route);
    void delete(Long id);
}
