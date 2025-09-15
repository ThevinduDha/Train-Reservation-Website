package lk.sliit.lankarail.repository;

import lk.sliit.lankarail.model.Train;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrainRepository extends JpaRepository<Train, Long> {
    // add custom queries here later if needed
}
