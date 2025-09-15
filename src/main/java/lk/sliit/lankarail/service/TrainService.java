package lk.sliit.lankarail.service;

import lk.sliit.lankarail.model.Train;
import java.util.List;

public interface TrainService {
    Train create(Train train);
    Train findById(Long id);
    List<Train> findAll();
    Train update(Long id, Train train);
    void delete(Long id);
}
