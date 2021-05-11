package com.hanmaum.counseling.domain.post.repository.story;


import com.hanmaum.counseling.domain.post.dto.SimpleStoryDto;
import com.hanmaum.counseling.domain.post.entity.Story;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import javax.persistence.EntityManager;
import java.util.*;
import java.util.stream.Collectors;

import static com.hanmaum.counseling.domain.post.entity.QCounsel.counsel;
import static com.hanmaum.counseling.domain.post.entity.QLetter.*;
import static com.hanmaum.counseling.domain.post.entity.QStory.story;

@Repository
@RequiredArgsConstructor
public class StoryRepositoryImpl implements StoryRepositoryCustom{
    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final int CANDIDATES  = 6;
    private final int PICK_MAX = 3;

    /**
     * 랜덤으로 CANDIDATES 명의 사연을 중복없이 뽑기
     */
    public List<SimpleStoryDto> getCandidates(Long userId){
        List<Long> ids = queryFactory
                .select(story.id)
                .from(story)
                .where(story.writerId.ne(userId)
                        .and(story.picked.lt(PICK_MAX)))
                .fetch();
        if(ids.size() == 0){
            return Collections.emptyList();
        }
        Set<Long> randomSet = new HashSet<>();
        Random random = new Random();
        while(true){
            int i = random.nextInt(ids.size());
            randomSet.add(ids.get(i));
            if(randomSet.size() == CANDIDATES || randomSet.size() == ids.size()) break;
        }

        return queryFactory
                .select(Projections.constructor(SimpleStoryDto.class,
                        story.id, story.form.title, story.form.content, story.createdAt))
                .from(story)
                .where(story.id.in(randomSet))
                .fetch();
    }

    @Override
    public List<Story> findByWriterId(Long userId) {
        List<Story> stories = queryFactory
                .selectFrom(story).distinct()
                .leftJoin(story.counsels, counsel).fetchJoin()
                .where(story.writerId.eq(userId))
                .fetch();

        List<Long> selectedStoryIds = stories.stream()
                .map(Story::getId)
                .collect(Collectors.toList());

        queryFactory
                .selectFrom(counsel).distinct()
                .leftJoin(counsel.letters).fetchJoin()
                .where(counsel.story.id.in(selectedStoryIds))
                .fetch();
        return stories;
    }
}
