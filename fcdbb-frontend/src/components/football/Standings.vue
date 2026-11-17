<template>
  <div class="standings">
    <div class="table-shell standings-table">
      <table class="data-table">
        <thead>
          <tr>
            <th>Đội</th>
            <th class="numeric">Trận</th>
            <th class="numeric">Thắng</th>
            <th class="numeric">Hòa</th>
            <th class="numeric">Thua</th>
            <th class="numeric">Hiệu số</th>
            <th class="numeric">Điểm</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in teams" :key="t.team">
            <td>
              <span class="flex items-center gap-2 font-semibold"
                ><span class="team-chip" :class="{ b: t.team === 'B' }">{{
                  t.team
                }}</span
                >Đội {{ t.team }}</span
              >
            </td>
            <td class="numeric">{{ t.played }}</td>
            <td class="numeric">{{ t.won }}</td>
            <td class="numeric">{{ t.drawn }}</td>
            <td class="numeric">{{ t.lost }}</td>
            <td class="numeric">
              {{ t.goalsFor - t.goalsAgainst > 0 ? "+" : ""
              }}{{ t.goalsFor - t.goalsAgainst }}
            </td>
            <td class="numeric font-bold">{{ t.points }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="standings-mobile" aria-label="Bảng xếp hạng hai đội">
      <article
        v-for="t in teams"
        :key="t.team"
        class="standing-team"
        :class="{ 'squad-b': t.team === 'B' }"
      >
        <div class="standing-team-heading">
          <span class="team-chip" :class="{ b: t.team === 'B' }">{{
            t.team
          }}</span
          ><strong>Đội {{ t.team }}</strong
          ><span class="standing-points"
            ><strong>{{ t.points }}</strong> điểm</span
          >
        </div>
        <dl class="standing-numbers">
          <div>
            <dt>Trận</dt>
            <dd>{{ t.played }}</dd>
          </div>
          <div>
            <dt>Thắng</dt>
            <dd>{{ t.won }}</dd>
          </div>
          <div>
            <dt>Hòa</dt>
            <dd>{{ t.drawn }}</dd>
          </div>
          <div>
            <dt>Thua</dt>
            <dd>{{ t.lost }}</dd>
          </div>
          <div>
            <dt>Hiệu số</dt>
            <dd>
              {{ t.goalsFor - t.goalsAgainst > 0 ? "+" : ""
              }}{{ t.goalsFor - t.goalsAgainst }}
            </dd>
          </div>
        </dl>
      </article>
    </div>
  </div>
</template>
<script setup>
defineProps({ teams: { type: Array, default: () => [] } });
</script>
